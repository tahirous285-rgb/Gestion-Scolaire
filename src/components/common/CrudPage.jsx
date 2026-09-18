import React, { useEffect, useMemo, useState } from "react";
import "./CrudPage.css";

function valueFor(row, key) { return key.split(".").reduce((a, k) => a?.[k], row); }
function labelOf(value) { if (value === null || value === undefined || value === "") return "—"; return String(value); }

export default function CrudPage({
  title, subtitle, icon = "📋", columns = [], fields = [], load, create, update, remove,
  createPayload = (v) => v, updatePayload = (v) => v,
  canCreate = true, canUpdate = Boolean(update), canDelete = Boolean(remove),
  rowKey = "id", createLabel = "Nouveau", emptyText = "Aucune donnée.",
  searchKeys = [], extraActions, initialForm = {}, normalize = (x) => x,
}) {
  const [rows, setRows] = useState([]), [search, setSearch] = useState(""), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [modal, setModal] = useState(false), [viewModal, setViewModal] = useState(false), [editing, setEditing] = useState(null), [selected, setSelected] = useState(null), [menu, setMenu] = useState(null), [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function refresh() { try { setLoading(true); setError(""); const data = await load(); setRows(Array.isArray(data) ? data.map(normalize) : []); } catch (e) { setError(e.message || "Erreur de chargement."); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  const filtered = useMemo(() => { const q = search.toLowerCase().trim(); if (!q) return rows; return rows.filter(r => searchKeys.some(k => String(valueFor(r,k) ?? "").toLowerCase().includes(q))); }, [rows, search, searchKeys]);
  function openCreate() { setEditing(null); setForm(initialForm); setError(""); setModal(true); setMenu(null); }
  function openEdit(row) { setEditing(row); const f = {}; fields.forEach(x => { f[x.name] = row[x.name] ?? x.default ?? ""; }); setForm(f); setError(""); setModal(true); setMenu(null); }
  function closeModal(force = false) { if (force || !saving) { setModal(false); setEditing(null); } }
  function change(e) { const {name, value, type, checked} = e.target; setForm(f => ({...f, [name]: type === "checkbox" ? checked : value})); }
  async function submit(e) { e.preventDefault(); try { setSaving(true); setError(""); if (editing) await update(editing[rowKey], updatePayload(form, editing)); else await create(createPayload(form)); await refresh(); closeModal(true); } catch(e) { setError(e.message || "Erreur d'enregistrement."); } finally { setSaving(false); } }
  async function del(row) { if (!window.confirm(`Supprimer « ${row[fields[0]?.name] || row[rowKey]} » ?`)) return; try { await remove(row[rowKey]); setMenu(null); await refresh(); } catch(e) { setError(e.message || "Suppression impossible."); } }
  return <div className="crud-page">
    <div className="crud-header"><div><h1>{icon} {title}</h1><p>{subtitle}</p></div>{canCreate && <button className="crud-primary" onClick={openCreate}>＋ {createLabel}</button>}</div>
    {error && <div className="crud-alert"><span>⚠️ {error}</span><button onClick={() => setError("")}>×</button></div>}
    <div className="crud-toolbar"><input className="crud-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Rechercher dans ${title.toLowerCase()}...`} /><button className="crud-secondary" onClick={refresh}>↻ Actualiser</button></div>
    <div className="crud-table-card">{loading ? <div className="crud-state"><div className="crud-spinner"/>Chargement...</div> : filtered.length === 0 ? <div className="crud-state"><div className="crud-empty">{icon}</div><h3>{emptyText}</h3></div> : <div className="crud-table-wrap"><table className="crud-table"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map(row => <tr key={row[rowKey]}>{columns.map(c=><td key={c.key}>{c.render ? c.render(row) : labelOf(valueFor(row,c.key))}</td>)}<td className="crud-actions"><button className="crud-menu-btn" onClick={()=>setMenu(menu===row[rowKey]?null:row[rowKey])}>⋮</button>{menu===row[rowKey] && <div className="crud-menu"><button onClick={()=>{setSelected(row);setViewModal(true);setMenu(null)}}>👁️ Consulter</button>{canUpdate && <button onClick={()=>openEdit(row)}>✏️ Modifier</button>}{extraActions?.(row, ()=>setMenu(null))}{canDelete && <button className="danger" onClick={()=>del(row)}>🗑️ Supprimer</button>}</div>}</td></tr>)}</tbody></table></div>}</div>
    {modal && <div className="crud-overlay" onMouseDown={closeModal}><div className="crud-modal" onMouseDown={e=>e.stopPropagation()}><div className="crud-modal-head"><div><h2>{editing ? `Modifier — ${title}` : `Ajouter — ${title}`}</h2><p>Remplissez les informations demandées.</p></div><button onClick={closeModal}>×</button></div><form onSubmit={submit} className="crud-form"><div className="crud-form-grid">{fields.map(f=><div key={f.name} className={f.full ? "full" : ""}><label>{f.label}{f.required ? " *" : ""}</label>{f.type === "textarea" ? <textarea name={f.name} rows="4" required={f.required} value={form[f.name] ?? ""} onChange={change} placeholder={f.placeholder||""}/> : f.type === "select" ? <select name={f.name} required={f.required} value={form[f.name] ?? ""} onChange={change}><option value="">Sélectionner...</option>{(f.options||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select> : f.type === "checkbox" ? <label className="crud-check"><input name={f.name} type="checkbox" checked={Boolean(form[f.name])} onChange={change}/><span>{f.checkLabel || f.label}</span></label> : <input name={f.name} type={f.type||"text"} required={f.required} value={form[f.name] ?? ""} onChange={change} placeholder={f.placeholder||""} step={f.step} min={f.min}/>}</div>)}</div><div className="crud-form-actions"><button type="button" className="crud-secondary" onClick={closeModal}>Annuler</button><button className="crud-primary" disabled={saving}>{saving?"Enregistrement…": "Enregistrer"}</button></div></form></div></div>}
    {viewModal && selected && <div className="crud-overlay" onMouseDown={()=>setViewModal(false)}><div className="crud-modal" onMouseDown={e=>e.stopPropagation()}><div className="crud-modal-head"><div><h2>Détails — {title}</h2></div><button onClick={()=>setViewModal(false)}>×</button></div><div className="crud-details">{columns.map(c=><div className="crud-detail" key={c.key}><span>{c.label}</span><strong>{c.render ? c.render(selected) : labelOf(valueFor(selected,c.key))}</strong></div>)}</div></div></div>}
  </div>
}
