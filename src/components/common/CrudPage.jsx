import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fileToStoredPhoto, photoUrl, PHOTO_ACCEPT } from "../../utils/imageFile";
import "./CrudPage.css";

function valueFor(row, key) {
  return key.split(".").reduce((value, part) => value?.[part], row);
}

function labelOf(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
}

function serializeValue(field, value) {
  if (field.type === "number" || field.name?.startsWith("id_")) {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }
  if (field.type === "checkbox") return Boolean(value);
  if (value === "") return null;
  return value;
}

function serializeForm(form, fields) {
  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  return Object.entries(form).reduce((payload, [name, value]) => {
    const field = fieldMap.get(name) || {};
    const serialized = serializeValue(field, value);
    if (serialized !== undefined) payload[name] = serialized;
    return payload;
  }, {});
}

function errorMessageFor(requestError, fallback, formatter) {
  return formatter
    ? formatter(requestError, fallback)
    : requestError.message || fallback;
}

function Field({ field, value, onChange, disabled, imageLoading = false }) {
  const fileInputRef = useRef(null);
  const common = {
    name: field.name,
    value: value ?? "",
    onChange,
    required: field.required,
    disabled: disabled || field.disabled,
    placeholder: field.placeholder || "",
    "aria-describedby": field.help ? `${field.name}-help` : undefined,
  };

  return (
    <div className={`crud-field ${field.full ? "full" : ""}`}>
      {field.type === "checkbox" ? (
        <label className="crud-check">
          <input
            name={field.name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={onChange}
            disabled={disabled || field.disabled}
          />
          <span>{field.checkLabel || field.label}</span>
        </label>
      ) : (
        <>
          <label htmlFor={field.name}>
            {field.label}
            {field.required ? " *" : ""}
          </label>
          {field.type === "textarea" ? (
            <textarea {...common} id={field.name} rows={field.rows || 4} />
          ) : field.type === "select" ? (
            <select {...common} id={field.name}>
              <option value="">Sélectionner...</option>
              {(field.options || []).map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "image" ? (
            <div className="crud-image-field">
              {photoUrl(value) ? (
                <img src={photoUrl(value)} alt="Aperçu de la photo de l’élève" className="crud-image-preview" />
              ) : (
                <div className="crud-image-placeholder">Aucune photo</div>
              )}
              <div className="crud-image-actions">
                <input
                  ref={fileInputRef}
                  className="crud-file-input"
                  id={field.name}
                  name={field.name}
                  type="file"
                  accept={field.accept || PHOTO_ACCEPT}
                  aria-label="Choisir une photo"
                  disabled={disabled || field.disabled}
                  onChange={onChange}
                />
                <button
                  type="button"
                  className="crud-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || field.disabled}
                >
                  {photoUrl(value) ? "Remplacer la photo" : "Choisir une photo"}
                </button>
                {photoUrl(value) ? (
                  <button
                    type="button"
                    className="crud-secondary"
                    onClick={() => onChange({ target: { name: field.name, value: "", type: "text" } })}
                    disabled={disabled || field.disabled}
                  >
                    Retirer la photo
                  </button>
                ) : null}
                {imageLoading ? <small role="status">Traitement de la photo…</small> : null}
              </div>
            </div>
          ) : (
            <input
              {...common}
              id={field.name}
              type={field.type || "text"}
              step={field.step}
              min={field.min}
              max={field.max}
            />
          )}
          {field.help && (
            <small id={`${field.name}-help`} className="crud-field-help">
              {field.help}
            </small>
          )}
        </>
      )}
    </div>
  );
}

export default function CrudPage({
  title,
  headingLevel = "h1",
  subtitle,
  icon = "📋",
  columns = [],
  fields = [],
  createFields = fields,
  editFields = fields,
  load,
  create,
  update,
  remove,
  createPayload,
  updatePayload,
  canCreate = Boolean(create),
  canUpdate = Boolean(update),
  canDelete = Boolean(remove),
  canView = Boolean(update || remove),
  rowKey = "id",
  createLabel = "Nouveau",
  emptyText = "Aucune donnée.",
  searchKeys = [],
  extraActions,
  toolbarActions,
  initialForm = {},
  normalize = (row) => row,
  onLoaded,
  onLoadError,
  onSuccess,
  formatError,
  pagination = null,
}) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const photoReadRequestRef = useRef(0);
  const photoReadInProgressRef = useRef(false);
  const submitInProgressRef = useRef(false);
  const mountedRef = useRef(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const pageSize = pagination?.pageSize || null;
  const [form, setForm] = useState(initialForm);
  // Capture la requête au montage : les actions de la page utilisent ensuite
  // exactement le même contrat de chargement, sans boucle d’effet.
  const [requestLoader] = useState(() => load);
  const [rowNormalizer] = useState(() => normalize);
  const [loadedCallback] = useState(() => onLoaded);
  const [loadErrorCallback] = useState(() => onLoadError);
  const [successCallback] = useState(() => onSuccess);
  const [errorFormatter] = useState(() => formatError);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      photoReadRequestRef.current += 1;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = pageSize
        ? await requestLoader({ skip: page * pageSize, limit: pageSize })
        : await requestLoader();
      const nextRows = Array.isArray(data) ? data.map(rowNormalizer) : [];
      if (!mountedRef.current) return nextRows;
      setRows(nextRows);
      setHasNextPage(Boolean(pageSize && nextRows.length === pageSize));
      loadedCallback?.(nextRows);
      return nextRows;
    } catch (requestError) {
      if (mountedRef.current) {
        setError(errorMessageFor(requestError, "Erreur de chargement.", errorFormatter));
        loadErrorCallback?.(requestError);
      }
      return [];
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [requestLoader, rowNormalizer, loadedCallback, loadErrorCallback, page, pageSize, errorFormatter]);

  useEffect(() => {
    // Chargement initial et changement de page : l’effet synchronise la table avec l’API.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) =>
        String(valueFor(row, key) ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [rows, search, searchKeys]);

  function openCreate() {
    photoReadRequestRef.current += 1;
    photoReadInProgressRef.current = false;
    setReadingPhoto(false);
    setSelected(null);
    setForm({ ...initialForm });
    setError("");
    setMenu(null);
    setModal("form");
  }

  function openEdit(row) {
    photoReadRequestRef.current += 1;
    photoReadInProgressRef.current = false;
    setReadingPhoto(false);
    setSelected(row);
    const nextForm = {};
    editFields.forEach((field) => {
      nextForm[field.name] = row[field.name] ?? field.default ?? "";
    });
    setForm(nextForm);
    setError("");
    setMenu(null);
    setModal("form");
  }

  function closeModal(force = false) {
    if (force || !saving) {
      photoReadRequestRef.current += 1;
      photoReadInProgressRef.current = false;
      setReadingPhoto(false);
      setModal(null);
      setSelected(null);
    }
  }

  async function change(event) {
    const { name, value, type, checked, files } = event.target;
    if (type === "file") {
      const file = files?.[0];
      event.target.value = "";
      if (!file) return;

      const requestId = ++photoReadRequestRef.current;
      photoReadInProgressRef.current = true;
      setReadingPhoto(true);
      setError("");
      try {
        const stored = await fileToStoredPhoto(file);
        if (requestId === photoReadRequestRef.current) {
          setForm((current) => ({ ...current, [name]: stored }));
        }
      } catch (readError) {
        if (requestId === photoReadRequestRef.current) {
          setError(readError.message || "Import de la photo impossible.");
        }
      } finally {
        if (requestId === photoReadRequestRef.current) {
          photoReadInProgressRef.current = false;
          setReadingPhoto(false);
        }
      }
      return;
    }
    if (name === "photo") {
      photoReadRequestRef.current += 1;
      photoReadInProgressRef.current = false;
      setReadingPhoto(false);
    }
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitInProgressRef.current) return;
    if (photoReadInProgressRef.current) {
      setError("Attendez la fin du traitement de la photo avant d’enregistrer l’élève.");
      return;
    }
    submitInProgressRef.current = true;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      let action = null;
      if (selected && update) {
        const payload = serializeForm(form, editFields);
        await update(
          selected[rowKey],
          updatePayload ? updatePayload(payload, selected) : payload,
        );
        action = "update";
      } else if (create) {
        const payload = serializeForm(form, createFields);
        await create(createPayload ? createPayload(payload) : payload);
        action = "create";
      }
      if (!mountedRef.current) return;
      if (action) {
        const message = successCallback?.(action);
        if (typeof message === "string") setSuccess(message);
      }
      await refresh();
      if (!mountedRef.current) return;
      closeModal(true);
    } catch (requestError) {
      if (mountedRef.current) {
        setError(errorMessageFor(requestError, "Erreur d'enregistrement.", errorFormatter));
      }
    } finally {
      submitInProgressRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  async function deleteRow(row) {
    const actionId = row[rowKey];
    if (actionBusy === actionId) return;
    const label = row[fields[0]?.name] || actionId;
    if (!window.confirm(`Supprimer « ${label} » ?`)) return;
    try {
      setActionBusy(actionId);
      setError("");
      setSuccess("");
      await remove(actionId);
      if (!mountedRef.current) return;
      setMenu(null);
      const message = successCallback?.("delete");
      if (typeof message === "string") setSuccess(message);
      await refresh();
    } catch (requestError) {
      if (mountedRef.current) {
        setError(errorMessageFor(requestError, "Suppression impossible.", errorFormatter));
      }
    } finally {
      if (mountedRef.current) setActionBusy(null);
    }
  }

  async function runAction(row, action) {
    const actionId = row[rowKey];
    if (actionBusy === actionId) return;
    try {
      setActionBusy(actionId);
      setError("");
      setSuccess("");
      await action(row);
      if (!mountedRef.current) return;
      setMenu(null);
      await refresh();
    } catch (requestError) {
      if (mountedRef.current) {
        setError(errorMessageFor(requestError, "Action impossible.", errorFormatter));
      }
    } finally {
      if (mountedRef.current) setActionBusy(null);
    }
  }

  const activeFields = selected ? editFields : createFields;
  const Heading = headingLevel;

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <div className="crud-eyebrow">Gestion scolaire</div>
          <Heading>
            <span aria-hidden="true">{icon}</span> {title}
          </Heading>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="crud-header-actions">
          {toolbarActions}
          {canCreate && (
            <button className="crud-primary" type="button" onClick={openCreate}>
              ＋ {createLabel}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="crud-alert" role="alert">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Fermer">
            ×
          </button>
        </div>
      )}
      {success && <div className="success-message" role="status">✓ {success}</div>}

      <div className="crud-toolbar">
        <label className="crud-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            className="crud-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Rechercher dans ${title.toLowerCase()}...`}
            aria-label={`Rechercher dans ${title}`}
          />
        </label>
        <button className="crud-secondary" type="button" onClick={refresh} disabled={loading}>
          ↻ Actualiser
        </button>
      </div>

      <div className="crud-table-card">
        {loading ? (
          <div className="crud-state">
            <div className="crud-spinner" />
            Chargement des données…
          </div>
        ) : filtered.length === 0 ? (
          <div className="crud-state">
            <div className="crud-empty" aria-hidden="true">
              {icon}
            </div>
            <h3>{search ? "Aucun résultat" : emptyText}</h3>
            {search && <p>Essayez une autre recherche.</p>}
          </div>
        ) : (
          <div className="crud-table-wrap">
            <table className="crud-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  {(canView || canUpdate || canDelete || extraActions) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row[rowKey]}>
                    {columns.map((column) => (
                      <td key={column.key} data-label={column.label}>
                        {column.render
                          ? column.render(row)
                          : labelOf(valueFor(row, column.key))}
                      </td>
                    ))}
                    {(canView || canUpdate || canDelete || extraActions) && (
                      <td className="crud-actions">
                        <button
                          className="crud-menu-btn"
                          type="button"
                          onClick={() => setMenu(menu === row[rowKey] ? null : row[rowKey])}
                          aria-label="Actions"
                          aria-expanded={menu === row[rowKey]}
                        >
                          ⋮
                        </button>
                        {menu === row[rowKey] && (
                          <div className="crud-menu">
                            {canView && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelected(row);
                                  setModal("view");
                                  setMenu(null);
                                }}
                              >
                                👁 Consulter
                              </button>
                            )}
                            {canUpdate && (
                              <button type="button" onClick={() => openEdit(row)}>
                                ✏ Modifier
                              </button>
                            )}
                            {extraActions?.(row, {
                              runAction: (action) => runAction(row, action),
                              closeMenu: () => setMenu(null),
                              setError,
                              busy: actionBusy === row[rowKey],
                            })}
                            {canDelete && (
                              <button
                                className="danger"
                                type="button"
                                disabled={actionBusy === row[rowKey]}
                                onClick={() => deleteRow(row)}
                              >
                                🗑 Supprimer
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pageSize && (
        <div className="crud-pagination" aria-label="Pagination">
          <button className="crud-secondary" type="button" disabled={page === 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))}>← Précédent</button>
          <span>Page {page + 1}</span>
          <button className="crud-secondary" type="button" disabled={!hasNextPage || loading} onClick={() => setPage((current) => current + 1)}>Suivant →</button>
        </div>
      )}

      {modal === "form" && (
        <div className="crud-overlay" onMouseDown={() => closeModal()}>
          <div className="crud-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="crud-modal-head">
              <div>
                <div className="crud-eyebrow">{selected ? "Modification" : "Création"}</div>
                <h2>{selected ? `Modifier — ${title}` : `Ajouter — ${title}`}</h2>
                <p>Les champs marqués d’un astérisque sont obligatoires.</p>
              </div>
              <button type="button" onClick={() => closeModal()} aria-label="Fermer">
                ×
              </button>
            </div>
            <form onSubmit={submit} className="crud-form">
              <div className="crud-form-grid">
                {activeFields.map((field) => (
                  <Field
                    key={field.name}
                    field={field}
                    value={form[field.name]}
                    onChange={change}
                    disabled={saving || (selected && field.disabledOnEdit)}
                    imageLoading={field.type === "image" && readingPhoto}
                  />
                ))}
              </div>
              <div className="crud-form-actions">
                <button type="button" className="crud-secondary" onClick={() => closeModal()}>
                  Annuler
                </button>
                <button className="crud-primary" type="submit" disabled={saving || readingPhoto}>
                  {readingPhoto ? "Traitement de la photo…" : saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "view" && selected && (
        <div className="crud-overlay" onMouseDown={() => closeModal(true)}>
          <div className="crud-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="crud-modal-head">
              <div>
                <div className="crud-eyebrow">Fiche détaillée</div>
                <h2>Détails — {title}</h2>
              </div>
              <button type="button" onClick={() => closeModal(true)} aria-label="Fermer">
                ×
              </button>
            </div>
            <div className="crud-details">
              {columns.map((column) => (
                <div className="crud-detail" key={column.key}>
                  <span>{column.label}</span>
                  <strong>
                    {column.render
                      ? column.render(selected)
                      : labelOf(valueFor(selected, column.key))}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
