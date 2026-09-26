import { useCallback, useEffect, useRef, useState } from "react";
import "./ModuleKit.css";

/* ==========================================================================
   Boîte à outils partagée par les modules (Finance, Honoraires, Communication,
   Administration…). Même esprit visuel que les pages Élèves / Classes :
   en-tête, cartes statistiques, barre d'outils, tableau avec menu ⋮, modales.
   ========================================================================== */

export function ModulePage({ className = "", children }) {
  return <div className={`mk-page ${className}`}>{children}</div>;
}

export function ModuleHeader({ icon, title, subtitle, children }) {
  return (
    <div className="mk-header">
      <div className="mk-header-title">
        {icon && <div className="mk-header-icon">{icon}</div>}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children && <div className="mk-header-actions">{children}</div>}
    </div>
  );
}

export function Alert({ message, onClose, kind = "error" }) {
  if (!message) return null;
  return (
    <div className={`mk-alert ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{kind === "error" ? "⚠️" : "✅"}</span>
      <span className="mk-alert-text">{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      )}
    </div>
  );
}

/** Message de succès éphémère. */
export function useFlash(delay = 3500) {
  const [flash, setFlash] = useState("");
  const timer = useRef(null);
  const show = useCallback(
    (message) => {
      setFlash(message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFlash(""), delay);
    },
    [delay],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [flash, show, () => setFlash("")];
}

export function StatGrid({ children, columns = 4 }) {
  return (
    <div className="mk-stats" style={{ "--mk-cols": columns }}>
      {children}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, tone = "blue" }) {
  return (
    <div className={`mk-stat-card tone-${tone}`}>
      <div className="mk-stat-icon">{icon}</div>
      <div className="mk-stat-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="mk-toolbar">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div className="mk-search">
      <span>🔍</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Effacer">
          ×
        </button>
      )}
    </div>
  );
}

export function FilterSelect({ value, onChange, options = [], placeholder = "Tous", label }) {
  return (
    <label className="mk-filter">
      {label && <span>{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RefreshButton({ onClick, loading }) {
  return (
    <button type="button" className="mk-btn mk-btn-light" onClick={onClick} disabled={loading}>
      <span className={loading ? "mk-rotate" : ""}>↻</span> Actualiser
    </button>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mk-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={value === tab.value ? "active" : ""}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="mk-tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  return <span className={`mk-badge ${tone}`}>{children}</span>;
}

export function Avatar({ text, tone = "blue" }) {
  const letters = String(text || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return <div className={`mk-avatar tone-${tone}`}>{letters || "?"}</div>;
}

export function Progress({ value = 0, tone }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const auto = pct >= 100 ? "green" : pct >= 50 ? "blue" : pct > 0 ? "orange" : "red";
  return (
    <div className={`mk-progress tone-${tone || auto}`}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LoadingState({ text = "Chargement..." }) {
  return (
    <div className="mk-state">
      <div className="mk-spinner" />
      <p>{text}</p>
    </div>
  );
}

export function EmptyState({ icon = "📭", title, text, children }) {
  return (
    <div className="mk-state">
      <div className="mk-empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

/**
 * Tableau générique.
 * columns : [{ key, label, render(row), className, align }]
 * actions(row, close) : contenu du menu ⋮
 */
export function DataTable({
  columns,
  rows,
  rowKey,
  loading,
  emptyIcon,
  emptyTitle = "Aucune donnée",
  emptyText,
  actions,
  onRowClick,
  rowClassName,
  footer,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    if (openMenu === null) return undefined;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  return (
    <div className="mk-table-card">
      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} text={emptyText} />
      ) : (
        <div className="mk-table-wrap">
          <table className="mk-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={column.align ? `align-${column.align}` : ""}>
                    {column.label}
                  </th>
                ))}
                {actions && <th className="align-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
                return (
                  <tr
                    key={id}
                    className={`${onRowClick ? "clickable" : ""} ${rowClassName ? rowClassName(row) : ""}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className={`${column.className || ""} ${column.align ? `align-${column.align}` : ""}`}>
                        {column.render ? column.render(row) : displayValue(row[column.key])}
                      </td>
                    ))}
                    {actions && (
                      <td className="mk-actions-cell align-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="mk-menu-btn"
                          aria-label="Actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === id ? null : id);
                          }}
                        >
                          ⋮
                        </button>
                        {openMenu === id && (
                          <div className="mk-action-menu" onClick={(e) => e.stopPropagation()}>
                            {actions(row, () => setOpenMenu(null))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {footer && !loading && rows.length > 0 && <div className="mk-table-footer">{footer}</div>}
    </div>
  );
}

export function MenuItem({ icon, children, onClick, danger, disabled }) {
  return (
    <button type="button" className={danger ? "danger" : ""} onClick={onClick} disabled={disabled}>
      {icon && <span className="mk-menu-icon">{icon}</span>}
      {children}
    </button>
  );
}

export function Modal({ open, title, subtitle, onClose, children, width = 720, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="mk-overlay" onMouseDown={onClose}>
      <div className="mk-modal" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mk-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="mk-modal-body">{children}</div>
        {footer && <div className="mk-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Formulaire déclaratif utilisé dans les modales.
 * fields : [{ name, label, type, required, options, full, min, max, step, placeholder, help, disabled }]
 */
export function FormFields({ fields, values, onChange, errors = {} }) {
  function handle(e) {
    const { name, value, type, checked } = e.target;
    onChange(name, type === "checkbox" ? checked : value);
  }

  return (
    <div className="mk-form-grid">
      {fields.filter(Boolean).map((field) => {
        if (field.type === "section") {
          return (
            <div key={field.name} className="mk-form-section full">
              {field.label}
            </div>
          );
        }
        const common = {
          id: `mk-${field.name}`,
          name: field.name,
          required: field.required,
          disabled: field.disabled,
          onChange: handle,
        };
        let input;
        if (field.type === "textarea") {
          input = <textarea {...common} rows={field.rows || 4} value={values[field.name] ?? ""} placeholder={field.placeholder || ""} />;
        } else if (field.type === "select") {
          input = (
            <select {...common} value={values[field.name] ?? ""}>
              <option value="">{field.placeholder || "Sélectionner..."}</option>
              {(field.options || []).map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        } else if (field.type === "checkbox") {
          input = (
            <label className="mk-check">
              <input {...common} type="checkbox" checked={Boolean(values[field.name])} />
              <span>{field.checkLabel || field.label}</span>
            </label>
          );
        } else {
          input = (
            <input
              {...common}
              type={field.type || "text"}
              value={values[field.name] ?? ""}
              placeholder={field.placeholder || ""}
              min={field.min}
              max={field.max}
              step={field.step}
            />
          );
        }
        return (
          <div key={field.name} className={`mk-field ${field.full ? "full" : ""} ${errors[field.name] ? "has-error" : ""}`}>
            {field.type !== "checkbox" && (
              <label htmlFor={`mk-${field.name}`}>
                {field.label}
                {field.required && <em> *</em>}
              </label>
            )}
            {input}
            {errors[field.name] ? <small className="mk-error">{errors[field.name]}</small> : field.help && <small>{field.help}</small>}
          </div>
        );
      })}
    </div>
  );
}

export function FormActions({ onCancel, saving, submitLabel = "Enregistrer", disabled }) {
  return (
    <div className="mk-form-actions">
      <button type="button" className="mk-btn mk-btn-light" onClick={onCancel} disabled={saving}>
        Annuler
      </button>
      <button type="submit" className="mk-btn mk-btn-primary" disabled={saving || disabled}>
        {saving ? "Enregistrement…" : submitLabel}
      </button>
    </div>
  );
}

export function DetailGrid({ items }) {
  return (
    <div className="mk-details">
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className={`mk-detail ${item.full ? "full" : ""}`}>
          <span>{item.label}</span>
          <strong>{item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Pill({ active, onClick, children }) {
  return (
    <button type="button" className={`mk-pill ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
}

/** Chargement asynchrone standard (données + état + erreur). */
export function useAsyncData(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loaderRef.current();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || "Erreur de chargement.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setError, reload, setData };
}

/** Exécute plusieurs chargeurs en tolérant les échecs individuels. */
export async function loadAll(loaders) {
  const entries = Object.entries(loaders);
  const results = await Promise.all(
    entries.map(async ([key, fn]) => {
      try {
        const value = await fn();
        return [key, Array.isArray(value) ? value : value ?? []];
      } catch {
        return [key, []];
      }
    }),
  );
  return Object.fromEntries(results);
}
