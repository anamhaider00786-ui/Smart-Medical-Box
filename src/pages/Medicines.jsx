import { useMemo, useState } from 'react'
import { Edit3, Filter, MoreHorizontal, Pill, Plus, Search, Trash2 } from 'lucide-react'
import MedicineForm from '../components/MedicineForm'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/helpers'

export default function Medicines({ data, notify }) {
  const [query,setQuery]=useState(''); const [filter,setFilter]=useState('all'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [deleting,setDeleting]=useState(null)
  const list=useMemo(()=>data.medicines.filter(m=>(m.name.toLowerCase().includes(query.toLowerCase())||m.dosage.toLowerCase().includes(query.toLowerCase()))&&(filter==='all'||(filter==='active'?m.active:!m.active))),[data.medicines,query,filter])
  const save=m=>{editing?data.editMedicine(editing.id,m):data.addMedicine(m);notify(editing?'Medicine updated.':'Medicine added.');setEditing(null)}
  return <div>
    <div className="page-heading"><div><span className="eyebrow">Medication library</span><h1>Medicines</h1><p>Manage the medicines stored in your Smart Medical Box.</p></div><button className="button button-primary" onClick={()=>{setEditing(null);setOpen(true)}}><Plus size={17}/> Add medicine</button></div>
    <div className="toolbar card"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search medicines…"/></div><div className="filter-tabs"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button><button className={filter==='active'?'active':''} onClick={()=>setFilter('active')}>Active</button><button className={filter==='inactive'?'active':''} onClick={()=>setFilter('inactive')}>Inactive</button></div><Filter size={17} className="toolbar-filter"/></div>
    <section className="medicine-grid">{list.map(m=><article className="medicine-card card" key={m.id}><div className="medicine-card-top"><div className="medicine-icon"><Pill size={20}/></div><div className="menu-wrap"><button className="icon-button" aria-label={`Actions for ${m.name}`}><MoreHorizontal size={18}/></button><div className="hover-menu"><button onClick={()=>{setEditing(m);setOpen(true)}}><Edit3 size={14}/> Edit</button><button onClick={()=>setDeleting(m)}><Trash2 size={14}/> Delete</button></div></div></div><div className="medicine-title"><h3>{m.name}</h3><StatusBadge status={m.active?'Ready':'Empty'}/></div><strong className="dosage">{m.dosage}</strong><p>{m.notes||'No notes added.'}</p><div className="medicine-meta"><span>Compartment <b>#{m.compartment}</b></span><span>{formatDate(m.start_date)} — {m.end_date?formatDate(m.end_date):'ongoing'}</span></div></article>)}{!list.length&&<EmptyState title="No medicines found" text="Try a different search or add your first medicine."/>}</section>
    <MedicineForm open={open} medicine={editing} onClose={()=>{setOpen(false);setEditing(null)}} onSave={save}/>
    <ConfirmDialog open={Boolean(deleting)} title="Delete medicine?" message={`Delete ${deleting?.name}? Any demo schedules linked to it will also be removed.`} onCancel={()=>setDeleting(null)} onConfirm={()=>{data.removeMedicine(deleting.id);notify('Medicine deleted.');setDeleting(null)}}/>
  </div>
}
