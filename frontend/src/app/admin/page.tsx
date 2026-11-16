"use client";

import { FormEvent,useCallback,useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type User={id:number;name:string;email:string;role:'USER'|'ADMIN';active:boolean;createdAt:string;_count:{contacts:number}};

export default function AdminPage() {
 const router=useRouter();
 const [users,setUsers]=useState<User[]>([]);
 const [error,setError]=useState('');
 const [showForm,setShowForm]=useState(false);

 const load=useCallback(async()=>{
  try { const data=await api<{users:User[]}>('/admin/users');setUsers(data.users);setError(''); }
  catch(e) {
   const message=e instanceof Error?e.message:'No se pudieron cargar los usuarios.';
   setError(message);
   if(message.includes('permission')||message.includes('Authentication')) router.replace('/contacts');
  }
 },[router]);
 useEffect(()=>{void load();},[load]);

 async function updateUser(user:User,changes:{role?:'USER'|'ADMIN';active?:boolean}) {
  try { await api(`/admin/users/${user.id}`,{method:'PATCH',body:JSON.stringify(changes)});await load(); }
  catch(e) { setError(e instanceof Error?e.message:'No se pudo actualizar el usuario.'); }
 }

 async function createUser(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const data=Object.fromEntries(['name','email','password','role'].map(key=>[key,form.get(key)]));
  try { await api('/admin/users',{method:'POST',body:JSON.stringify(data)});setShowForm(false);event.currentTarget.reset();await load(); }
  catch(e) { setError(e instanceof Error?e.message:'No se pudo crear el usuario.'); }
 }

 return <main className="app-shell">
  <header className="topbar"><a className="brand" href="/contacts"><span className="brand-mark small">C</span>Contactos</a><a className="button secondary" href="/contacts">Volver a contactos</a></header>
  <section className="content">
   <div className="page-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Usuarios</h1><p className="muted">Administra las cuentas, los roles y el estado de acceso.</p></div><button className="button primary" onClick={()=>setShowForm(true)}>Crear usuario</button></div>
   {error&&<p className="alert" role="alert">{error}</p>}
   <div className="panel table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Contactos</th><th>Registro</th><th>Acciones</th></tr></thead>
    <tbody>{users.map(user=><tr key={user.id}>
     <td><strong>{user.name}</strong><small>{user.email}</small></td>
     <td><span className={`role ${user.role.toLowerCase()}`}>{user.role==='ADMIN'?'Administrador':'Estándar'}</span></td>
     <td>{user.active?'Activo':'Dado de baja'}</td>
     <td>{user._count.contacts}</td>
     <td>{new Date(user.createdAt).toLocaleDateString('es-SV')}</td>
     <td><div className="table-actions">
      <button className="text-button" onClick={()=>void updateUser(user,{role:user.role==='ADMIN'?'USER':'ADMIN'})}>Cambiar a {user.role==='ADMIN'?'Estándar':'Administrador'}</button>
      <button className="text-button" onClick={()=>void updateUser(user,{active:!user.active})}>{user.active?'Dar de baja':'Reactivar'}</button>
     </div></td>
    </tr>)}</tbody>
   </table>{users.length===0&&<p className="empty-message">No hay usuarios registrados.</p>}</div>
  </section>
  {showForm&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setShowForm(false);}}>
   <form className="panel modal" onSubmit={createUser}>
    <div className="modal-head"><h2>Crear usuario</h2><button type="button" className="close" onClick={()=>setShowForm(false)} aria-label="Cerrar">×</button></div>
    <label>Nombre<input name="name" required maxLength={100}/></label>
    <label>Correo electrónico<input name="email" type="email" required maxLength={150} pattern="[^@\s]+@[^@\s]+\.[A-Za-z]{2,}" title="Ingresa un correo válido, por ejemplo nombre@yahoo.com."/></label>
    <label>Contraseña<input name="password" type="password" required minLength={12} maxLength={128}/><small>Mínimo 12 caracteres.</small></label>
    <label>Rol<select name="role" required defaultValue=""><option value="" disabled>Selecciona un rol</option><option value="USER">Estándar</option><option value="ADMIN">Administrador</option></select></label>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setShowForm(false)}>Cancelar</button><button className="button primary">Crear cuenta</button></div>
   </form>
  </div>}
 </main>;
}
