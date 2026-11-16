"use client";

import { FormEvent,useCallback,useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type User={id:number;name:string;email:string;role:'USER'|'ADMIN'};
type Contact={
 id:number;nombres:string;apellidos:string;celular:string|null;telefonoFijo:string|null;
 correo:string|null;direccionCasa:string|null;direccionTrabajo:string|null;genero:string|null;
 fechaNacimiento:string|null;relacion:string|null;favorito:boolean
};
const textFields=['celular','telefonoFijo','correo','direccionCasa','direccionTrabajo'] as const;
function formatPhone(value:string) {
 const digits=value.replace(/\D/g,'').slice(0,8);
 return digits.length>=4?`${digits.slice(0,4)}-${digits.slice(4)}`:digits;
}

export default function ContactsPage() {
 const router=useRouter();
 const [user,setUser]=useState<User|null>(null);
 const [contacts,setContacts]=useState<Contact[]>([]);
 const [query,setQuery]=useState('');
 const [favoritesOnly,setFavoritesOnly]=useState(false);
 const [error,setError]=useState('');
 const [editing,setEditing]=useState<Contact|null>(null);
 const [showForm,setShowForm]=useState(false);

 const load=useCallback(async()=>{
  try {
   const result=await api<{contacts:Contact[]}>(`/contacts?q=${encodeURIComponent(query)}${favoritesOnly?'&favorite=true':''}`);
   setContacts(result.contacts);
   setError('');
  } catch(e) { setError(e instanceof Error?e.message:'No se pudieron cargar los contactos.'); }
 },[query,favoritesOnly]);

 useEffect(()=>{api<{user:User}>('/auth/me').then(result=>setUser(result.user)).catch(()=>router.replace('/login'));},[router]);
 useEffect(()=>{if(user) void load();},[user,load]);

 async function logout() {
  try { await api('/auth/logout',{method:'POST'});router.replace('/login'); }
  catch(e) { setError(e instanceof Error?e.message:'No se pudo cerrar la sesión.'); }
 }

 async function save(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const data=Object.fromEntries(['nombres','apellidos',...textFields,'genero','fechaNacimiento','relacion'].map(key=>[key,form.get(key)]));
  try {
   await api(editing?`/contacts/${editing.id}`:'/contacts',{method:editing?'PATCH':'POST',body:JSON.stringify(data)});
   setShowForm(false);setEditing(null);await load();
  } catch(e) { setError(e instanceof Error?e.message:'No se pudo guardar el contacto.'); }
 }

 async function toggleFavorite(contact:Contact) {
  try { await api(`/contacts/${contact.id}/favorite`,{method:contact.favorito?'DELETE':'PUT'});await load(); }
  catch(e) { setError(e instanceof Error?e.message:'No se pudo actualizar el favorito.'); }
 }

 async function remove(contact:Contact) {
  if(!window.confirm(`¿Eliminar a ${contact.nombres} ${contact.apellidos}?`)) return;
  try { await api(`/contacts/${contact.id}`,{method:'DELETE'});await load(); }
  catch(e) { setError(e instanceof Error?e.message:'No se pudo eliminar el contacto.'); }
 }

 if(!user) return <main className="loading">Cargando tus contactos…</main>;
 return <main className="app-shell">
  <header className="topbar">
   <a className="brand" href="/contacts"><span className="brand-mark small">C</span>Contactos</a>
   <nav className="top-actions">
    {user.role==='ADMIN'&&<a className="button secondary" href="/admin">Administrar usuarios</a>}
    <span className="user-name">{user.name}</span>
    <button className="button secondary" onClick={()=>void logout()}>Cerrar sesión</button>
   </nav>
  </header>
  <section className="content">
   <div className="page-heading">
    <div><p className="eyebrow">TU AGENDA</p><h1>Contactos</h1><p className="muted">Administra tus contactos personales.</p></div>
    <button className="button primary" onClick={()=>{setEditing(null);setShowForm(true);}}>＋ Agregar contacto</button>
   </div>
   <div className="toolbar">
    <input aria-label="Buscar contactos" placeholder="Buscar por nombre, correo o teléfono…" value={query} onChange={event=>setQuery(event.target.value)}/>
    <label className="check"><input type="checkbox" checked={favoritesOnly} onChange={event=>setFavoritesOnly(event.target.checked)}/> Favoritos</label>
   </div>
   {error&&<p className="alert" role="alert">{error}</p>}
   {contacts.length?
    <div className="contact-grid">{contacts.map(contact=><article className="panel contact-card" key={contact.id}>
     <div className="contact-card-head">
      <div className="avatar">{contact.nombres.slice(0,1).toUpperCase()}</div>
      <button className={`favorite ${contact.favorito?'selected':''}`} aria-label={contact.favorito?'Quitar de favoritos':'Agregar a favoritos'} onClick={()=>void toggleFavorite(contact)}>{contact.favorito?'★':'☆'}</button>
     </div>
     <h2>{contact.nombres} {contact.apellidos}</h2>
     {contact.correo&&<p className="contact-details"><a href={`mailto:${contact.correo}`}>{contact.correo}</a></p>}
     {contact.celular&&<p className="contact-details">Celular: <a href={`tel:${contact.celular}`}>{contact.celular}</a></p>}
     {contact.telefonoFijo&&<p className="contact-details">Teléfono fijo: {contact.telefonoFijo}</p>}
     {contact.direccionCasa&&<p className="notes">Casa: {contact.direccionCasa}</p>}
     {contact.direccionTrabajo&&<p className="notes">Trabajo: {contact.direccionTrabajo}</p>}
     {contact.genero&&<p className="notes">Género: {contact.genero}</p>}
     {contact.fechaNacimiento&&<p className="notes">Nacimiento: {contact.fechaNacimiento.slice(0,10)}</p>}
     {contact.relacion&&<p className="notes">Relación: {contact.relacion}</p>}
     <div className="card-actions">
      <button className="text-button" onClick={()=>{setEditing(contact);setShowForm(true);}}>Editar</button>
      <button className="text-button danger-text" onClick={()=>void remove(contact)}>Eliminar</button>
     </div>
    </article>)}</div>:
    <div className="panel empty"><div className="empty-icon">♡</div><h2>{favoritesOnly?'Aún no tienes favoritos':'No se encontraron contactos'}</h2><p className="muted">{query?'Prueba con otros términos.':'Agrega un contacto para comenzar.'}</p>{!favoritesOnly&&<button className="button primary" onClick={()=>{setEditing(null);setShowForm(true);}}>Agregar primer contacto</button>}</div>}
  </section>
  {showForm&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setShowForm(false);}}>
   <form className="panel modal" onSubmit={save} style={{maxHeight:'calc(100vh - 40px)',overflowY:'auto'}}>
    <div className="modal-head"><h2>{editing?'Editar contacto':'Nuevo contacto'}</h2><button type="button" className="close" onClick={()=>setShowForm(false)} aria-label="Cerrar">×</button></div>
    <div className="form-row">
     <label>Nombres<input name="nombres" defaultValue={editing?.nombres} required maxLength={100}/></label>
     <label>Apellidos<input name="apellidos" defaultValue={editing?.apellidos} required maxLength={100}/></label>
    </div>
    <div className="form-row">
     <label>Celular<input name="celular" type="tel" inputMode="numeric" placeholder="0000-0000" defaultValue={formatPhone(editing?.celular??'')} maxLength={9} pattern="[0-9]{4}-[0-9]{4}" title="Ingresa 8 dígitos; el guion se agrega automáticamente." onInput={event=>{event.currentTarget.value=formatPhone(event.currentTarget.value);}}/></label>
     <label>Teléfono fijo<input name="telefonoFijo" type="tel" inputMode="numeric" placeholder="0000-0000" defaultValue={formatPhone(editing?.telefonoFijo??'')} maxLength={9} pattern="[0-9]{4}-[0-9]{4}" title="Ingresa 8 dígitos; el guion se agrega automáticamente." onInput={event=>{event.currentTarget.value=formatPhone(event.currentTarget.value);}}/></label>
    </div>
    <label>Correo electrónico<input name="correo" type="email" defaultValue={editing?.correo??''} maxLength={150} pattern="[^@\s]+@[^@\s]+\.[A-Za-z]{2,}" title="Ingresa un correo válido, por ejemplo nombre@yahoo.com."/></label>
    <label>Dirección de casa<textarea name="direccionCasa" defaultValue={editing?.direccionCasa??''} rows={2}/></label>
    <label>Dirección de trabajo<textarea name="direccionTrabajo" defaultValue={editing?.direccionTrabajo??''} rows={2}/></label>
    <div className="form-row">
     <label>Género<select name="genero" defaultValue={editing?.genero??''}><option value="">Sin especificar</option><option>Masculino</option><option>Femenino</option><option>Otro</option></select></label>
     <label>Fecha de nacimiento<input name="fechaNacimiento" type="date" defaultValue={editing?.fechaNacimiento?.slice(0,10)??''}/></label>
    </div>
    <label>Relación personal<select name="relacion" defaultValue={editing?.relacion??''}><option value="">Sin especificar</option><option>Familia</option><option>Amigo</option><option>Trabajo</option><option>Otro</option></select></label>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setShowForm(false)}>Cancelar</button><button className="button primary">{editing?'Guardar cambios':'Agregar contacto'}</button></div>
   </form>
  </div>}
 </main>;
}
