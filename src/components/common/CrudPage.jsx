import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoPicker from "./PhotoPicker";
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
  return Object.fromEntries(fields.map((field) => [field.name, serializeValue(field, form[field.name])]).filter(([, value]) => value !== undefined));
}

function Field({ field, value, onChange, disabled, onPhotoBusy }) {
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
              {value && !(field.options || []).some((option) => String(option.value) === String(value)) && <option value={value}>Référence #{value} (non chargée)</option>}
              {(field.options || []).map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "image" ? (
            <PhotoPicker value={value} disabled={disabled || field.disabled} onBusyChange={onPhotoBusy}
              onChange={(photo) => onChange({ target: { name: field.name, value: photo, type: "text" } })} />
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
  rowKey = "id",
  createLabel = "Nouveau",
  emptyText = "Aucune donnée.",
  searchKeys = [],
  extraActions,
  toolbarActions,
  initialForm = {},
  normalize = (row) => row,
  onLoaded,
  pagination = null,
  renderFormExtra,
  referenceError,
}) {
  const operation = useRef(false);
  const requestVersion = useRef(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const pageSize = pagination?.pageSize || null;
  const [form, setForm] = useState(initialForm);
  // Capture la requête au montage : les actions de la page utilisent ensuite
  // exactement le même contrat de chargement, sans boucle d’effet.
  const [requestLoader] = useState(() => load);
  const [rowNormalizer] = useState(() => normalize);
  const [loadedCallback] = useState(() => onLoaded);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      setError("");
      const data = pageSize
        ? await requestLoader({ skip: page * pageSize, limit: pageSize })
        : await requestLoader();
      if (version !== requestVersion.current) return [];
      const nextRows = Array.isArray(data) ? data.map(rowNormalizer) : [];
      setRows(nextRows);
      setHasNextPage(Boolean(pageSize && nextRows.length === pageSize));
      loadedCallback?.(nextRows);
      return nextRows;
    } catch (requestError) {
      if (version === requestVersion.current) setError(requestError.message || "Erreur de chargement.");
      return [];
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [requestLoader, rowNormalizer, loadedCallback, page, pageSize]);

  useEffect(() => {
    // Chargement initial et changement de page : l’effet synchronise la table avec l’API.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh();
    return () => { requestVersion.current += 1; };
  }, [refresh]);

  const optionLabels = useMemo(() => new Map([...createFields, ...editFields]
    .filter((field) => field.type === "select")
    .map((field) => [field.name, new Map((field.options || []).map((option) => [String(option.value), option.label]))])), [createFields, editFields]);
  function displayValue(row, key) {
    const value = valueFor(row, key);
    return optionLabels.get(key)?.get(String(value)) ?? labelOf(value);
  }
  const detailColumns = [...columns, ...[...createFields, ...editFields].filter((field, index, all) =>
    field.type !== "password" && !columns.some((column) => column.key === field.name) && all.findIndex((entry) => entry.name === field.name) === index
  ).map((field) => ({ key: field.name, label: field.label }))];

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) =>
        `${valueFor(row, key) ?? ""} ${optionLabels.get(key)?.get(String(valueFor(row, key))) ?? ""}`
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [rows, search, searchKeys, optionLabels]);

  function openCreate() {
    setSelected(null);
    setForm({ ...Object.fromEntries(createFields.map((field) => [field.name, field.default ?? ""])), ...initialForm });
    setSuccess("");
    setError("");
    setMenu(null);
    setModal("form");
  }

  function openEdit(row) {
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
    if (force || (!saving && !photoBusy)) {
      setModal(null);
      setSelected(null);
    }
  }

  async function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      (selected ? editFields : createFields).filter((field) => field.dependsOn?.includes(name)).forEach((field) => { next[field.name] = ""; });
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (operation.current || photoBusy) return;
    operation.current = true;
    setSuccess("");
    try {
      setSaving(true);
      setError("");
      if (form.date_debut && form.date_fin && form.date_fin < form.date_debut) {
        throw new Error("La date de fin doit être postérieure ou égale à la date de début.");
      }
      if (selected && update) {
        const payload = serializeForm(form, editFields);
        await update(
          selected[rowKey],
          updatePayload ? updatePayload(payload, selected) : payload,
        );
      } else if (create) {
        const payload = serializeForm(form, createFields);
        await create(createPayload ? createPayload(payload) : payload);
      }
      setSuccess("Enregistrement effectué.");
      closeModal(true);
      await refresh();
      window.dispatchEvent(new Event("references:changed"));
    } catch (requestError) {
      setError(requestError.message || "Erreur d'enregistrement.");
    } finally {
      operation.current = false;
      setSaving(false);
    }
  }

  async function deleteRow(row) {
    if (operation.current) return;
    const label = row[fields[0]?.name] || row[rowKey];
    if (!window.confirm(`Supprimer « ${label} » ?`)) return;
    if (operation.current) return;
    operation.current = true;
    setSuccess("");
    try {
      setActionBusy(row[rowKey]);
      setError("");
      await remove(row[rowKey]);
      setSuccess("Suppression effectuée.");
      window.dispatchEvent(new Event("references:changed"));
      setMenu(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.message || "Suppression impossible.");
    } finally {
      operation.current = false;
      setActionBusy(null);
    }
  }

  async function runAction(row, action, { refresh: reload = true } = {}) {
    if (operation.current) return;
    operation.current = true;
    setSuccess("");
    try {
      setActionBusy(row[rowKey]);
      setError("");
      await action(row);
      setSuccess("Action effectuée.");
      setMenu(null);
      if (reload) await refresh();
    } catch (requestError) {
      setError(requestError.message || "Action impossible.");
    } finally {
      operation.current = false;
      setActionBusy(null);
    }
  }

  const activeFields = selected ? editFields : createFields;

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <div className="crud-eyebrow">Gestion scolaire</div>
          <h1>
            <span aria-hidden="true">{icon}</span> {title}
          </h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="crud-header-actions">
          {toolbarActions}
          {canCreate && create && (
            <button className="crud-primary" type="button" onClick={openCreate} disabled={saving || actionBusy !== null}>
              ＋ {createLabel}
            </button>
          )}
        </div>
      </div>

      {referenceError && <div className="crud-alert" role="alert">Référentiels indisponibles : {referenceError}</div>}
      {success && <div className="success-message" role="status">✓ {success}</div>}
      {error && modal !== "form" && (
        <div className="crud-alert" role="alert">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Fermer">
            ×
          </button>
        </div>
      )}

      <div className="crud-toolbar">
        <label className="crud-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            className="crud-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Rechercher dans les lignes chargées…`}
            aria-label={`Rechercher dans ${title}`}
          />
        </label>
        <button className="crud-secondary" type="button" onClick={refresh} disabled={loading || saving || actionBusy !== null}>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Callback transmis aux boutons uniquement, jamais exécuté au rendu. */}
                {/* oxlint-disable-next-line react/refs */}
                {filtered.map((row) => (
                  <tr key={row[rowKey]}>
                    {columns.map((column) => (
                      <td key={column.key} data-label={column.label}>
                        {column.render
                          ? column.render(row)
                          : displayValue(row, column.key)}
                      </td>
                    ))}
                    {(
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
                            {canUpdate && update && (
                              <button type="button" disabled={actionBusy !== null} onClick={() => openEdit(row)}>
                                ✏ Modifier
                              </button>
                            )}
                            {extraActions?.(row, {
                              runAction: (action, options) => runAction(row, action, options),
                              closeMenu: () => setMenu(null),
                              setError,
                              busy: actionBusy !== null,
                            })}
                            {canDelete && remove && (
                              <button
                                className="danger"
                                type="button"
                                disabled={actionBusy !== null}
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
          <div className="crud-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
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
            {referenceError && <div className="crud-alert" role="alert">Référentiels indisponibles : {referenceError}</div>}
            {error && <div className="crud-alert" role="alert">⚠️ {error}</div>}
            <form onSubmit={submit} className="crud-form">
              <div className="crud-form-grid">
                {activeFields.map((field) => (
                  <Field
                    key={field.name}
                    field={field.optionsFor ? { ...field, options: field.optionsFor(form) } : field}
                    value={form[field.name]}
                    onChange={change}
                    disabled={saving || photoBusy || (selected && field.disabledOnEdit)}
                    onPhotoBusy={setPhotoBusy}
                  />
                ))}
              </div>
              {renderFormExtra?.(form, { saving, setPhotoBusy })}
              <div className="crud-form-actions">
                <button type="button" className="crud-secondary" onClick={() => closeModal()}>
                  Annuler
                </button>
                <button className="crud-primary" type="submit" disabled={saving || photoBusy}>
                  {saving ? "Enregistrement…" : photoBusy ? "Préparation photo…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "view" && selected && (
        <div className="crud-overlay" onMouseDown={() => closeModal(true)}>
          <div className="crud-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
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
              {detailColumns.map((column) => (
                <div className="crud-detail" key={column.key}>
                  <span>{column.label}</span>
                  <strong>
                    {column.render
                      ? column.render(selected)
                      : displayValue(selected, column.key)}
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
