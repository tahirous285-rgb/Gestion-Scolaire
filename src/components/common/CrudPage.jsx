import { useCallback, useEffect, useMemo, useState } from "react";
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
  if (field.type === "number" || field.name.startsWith("id_")) {
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

function Field({ field, value, onChange, disabled }) {
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
}) {
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
    try {
      setLoading(true);
      setError("");
      const data = pageSize
        ? await requestLoader({ skip: page * pageSize, limit: pageSize })
        : await requestLoader();
      const nextRows = Array.isArray(data) ? data.map(rowNormalizer) : [];
      setRows(nextRows);
      setHasNextPage(Boolean(pageSize && nextRows.length === pageSize));
      loadedCallback?.(nextRows);
      return nextRows;
    } catch (requestError) {
      setError(requestError.message || "Erreur de chargement.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [requestLoader, rowNormalizer, loadedCallback, page, pageSize]);

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
    setSelected(null);
    setForm({ ...initialForm });
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
    if (force || !saving) {
      setModal(null);
      setSelected(null);
    }
  }

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
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
      await refresh();
      closeModal(true);
    } catch (requestError) {
      setError(requestError.message || "Erreur d'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row) {
    const label = row[fields[0]?.name] || row[rowKey];
    if (!window.confirm(`Supprimer « ${label} » ?`)) return;
    try {
      setActionBusy(row[rowKey]);
      setError("");
      await remove(row[rowKey]);
      setMenu(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.message || "Suppression impossible.");
    } finally {
      setActionBusy(null);
    }
  }

  async function runAction(row, action) {
    try {
      setActionBusy(row[rowKey]);
      setError("");
      await action(row);
      setMenu(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.message || "Action impossible.");
    } finally {
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
                  {(canUpdate || canDelete || extraActions) && <th>Actions</th>}
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
                    {(canUpdate || canDelete || extraActions) && (
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
                    disabled={selected && field.disabledOnEdit}
                  />
                ))}
              </div>
              <div className="crud-form-actions">
                <button type="button" className="crud-secondary" onClick={() => closeModal()}>
                  Annuler
                </button>
                <button className="crud-primary" type="submit" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
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
