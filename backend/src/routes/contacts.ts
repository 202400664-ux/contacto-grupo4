import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { emailSchema,optionalPhoneSchema } from '../validation';

export const contactsRouter=Router();
contactsRouter.use(requireAuth);

const optionalText=(max:number)=>z.string().trim().max(max).optional().nullable().transform(value=>value||null);
const contactFields={
 nombres:z.string().trim().min(1).max(100),
 apellidos:z.string().trim().min(1).max(100),
 celular:optionalPhoneSchema,
 telefonoFijo:optionalPhoneSchema,
 correo:z.union([emailSchema,z.literal('')]).optional().nullable().transform(value=>value||null),
 direccionCasa:optionalText(5000),
 direccionTrabajo:optionalText(5000),
 genero:z.union([z.enum(['Masculino','Femenino','Otro']),z.literal('')]).optional().nullable().transform(value=>value||null),
 fechaNacimiento:z.union([z.string().date(),z.literal('')]).optional().nullable().transform(value=>value?new Date(`${value}T00:00:00.000Z`):null),
 relacion:z.union([z.enum(['Familia','Amigo','Trabajo','Otro']),z.literal('')]).optional().nullable().transform(value=>value||null)
};
const contactInput=z.object(contactFields);
const contactUpdate=z.object(contactFields).partial();
const contactSelect={id:true,usuarioId:true,nombres:true,apellidos:true,celular:true,telefonoFijo:true,correo:true,direccionCasa:true,direccionTrabajo:true,genero:true,fechaNacimiento:true,relacion:true,favorito:true,createdAt:true} satisfies Prisma.ContactSelect;

function contactId(value:string):number|null {
 const id=Number(value);
 return Number.isSafeInteger(id)&&id>0?id:null;
}

contactsRouter.get('/',async(req,res,next)=>{
 try {
  const query=z.object({q:z.string().trim().max(100).optional(),favorite:z.enum(['true','false']).optional()}).parse(req.query);
  const where:Prisma.ContactWhereInput={usuarioId:req.user!.id};
  if(query.q) where.OR=['nombres','apellidos','correo','celular','telefonoFijo'].map(field=>({[field]:{contains:query.q,mode:'insensitive'}}));
  if(query.favorite==='true') where.favorito=true;
  const contacts=await prisma.contact.findMany({where,orderBy:[{nombres:'asc'},{apellidos:'asc'}],select:contactSelect});
  return res.json({contacts});
 } catch(error) { return next(error); }
});

contactsRouter.post('/',async(req,res,next)=>{
 try {
  const data=contactInput.parse(req.body);
  const contact=await prisma.contact.create({data:{...data,usuarioId:req.user!.id},select:contactSelect});
  return res.status(201).json({contact});
 } catch(error) { return next(error); }
});

contactsRouter.patch('/:id',async(req,res,next)=>{
 try {
  const id=contactId(req.params.id);
  if(!id) return res.status(400).json({error:'Invalid contact id.'});
  const data=contactUpdate.parse(req.body);
  if(Object.keys(data).length===0) return res.status(400).json({error:'Provide at least one field to update.'});
  const result=await prisma.contact.updateMany({where:{id,usuarioId:req.user!.id},data});
  if(!result.count) return res.status(404).json({error:'Contact not found.'});
  const contact=await prisma.contact.findUnique({where:{id},select:contactSelect});
  if(!contact) return res.status(404).json({error:'Contact not found.'});
  return res.json({contact});
 } catch(error) { return next(error); }
});

contactsRouter.delete('/:id',async(req,res,next)=>{
 try {
  const id=contactId(req.params.id);
  if(!id) return res.status(400).json({error:'Invalid contact id.'});
  const result=await prisma.contact.deleteMany({where:{id,usuarioId:req.user!.id}});
  if(!result.count) return res.status(404).json({error:'Contact not found.'});
  return res.status(204).end();
 } catch(error) { return next(error); }
});

contactsRouter.put('/:id/favorite',async(req,res,next)=>{
 try {
  const id=contactId(req.params.id);
  if(!id) return res.status(400).json({error:'Invalid contact id.'});
  const result=await prisma.contact.updateMany({where:{id,usuarioId:req.user!.id},data:{favorito:true}});
  if(!result.count) return res.status(404).json({error:'Contact not found.'});
  return res.json({id,favorito:true});
 } catch(error) { return next(error); }
});

contactsRouter.delete('/:id/favorite',async(req,res,next)=>{
 try {
  const id=contactId(req.params.id);
  if(!id) return res.status(400).json({error:'Invalid contact id.'});
  const result=await prisma.contact.updateMany({where:{id,usuarioId:req.user!.id},data:{favorito:false}});
  if(!result.count) return res.status(404).json({error:'Contact not found.'});
  return res.json({id,favorito:false});
 } catch(error) { return next(error); }
});
