import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAdmin,requireAuth } from '../middleware/auth';
import { emailSchema } from '../validation';

export const adminRouter=Router();
adminRouter.use(requireAuth,requireAdmin);

const roleNames={USER:'Estándar',ADMIN:'Administrador'} as const;
const roleInput=z.enum(['USER','ADMIN']);
const accountId=(value:string)=>{const id=Number(value);return Number.isSafeInteger(id)&&id>0?id:null;};
const accountSelect={id:true,nombre:true,email:true,activo:true,createdAt:true,rol:{select:{nombre:true}},_count:{select:{contactos:true}}} as const;
function presentUser(user:{id:number;nombre:string;email:string;activo:boolean;createdAt:Date;rol:{nombre:string};_count?:{contactos:number}}) {
 return {id:user.id,name:user.nombre,email:user.email,role:user.rol.nombre==='Administrador'?'ADMIN':'USER',active:user.activo,createdAt:user.createdAt,_count:{contacts:user._count?.contactos??0}};
}

adminRouter.get('/users',async(_req,res,next)=>{
 try {
  const users=await prisma.user.findMany({orderBy:{createdAt:'desc'},select:accountSelect});
  return res.json({users:users.map(presentUser)});
 } catch(error) { return next(error); }
});

adminRouter.patch('/users/:id',async(req,res,next)=>{
 try {
  const id=accountId(req.params.id);
  if(!id) return res.status(400).json({error:'Invalid user id.'});
  const data=z.object({role:roleInput.optional(),active:z.boolean().optional()}).refine(value=>value.role!==undefined||value.active!==undefined,{message:'Provide a role or active status.'}).parse(req.body);
  if(id===req.user!.id&&(data.role==='USER'||data.active===false)) return res.status(400).json({error:'You cannot deactivate or remove your own administrator role.'});
  const updateData:{activo?:boolean;rolId?:number}={};
  if(data.active!==undefined) updateData.activo=data.active;
  if(data.role!==undefined) {
   const role=await prisma.role.findUnique({where:{nombre:roleNames[data.role]}});
   if(!role) return res.status(500).json({error:`The ${roleNames[data.role]} role is missing from the database.`});
   updateData.rolId=role.id;
  }
  const result=await prisma.user.updateMany({where:{id},data:updateData});
  if(!result.count) return res.status(404).json({error:'User not found.'});
  const user=await prisma.user.findUnique({where:{id},select:accountSelect});
  if(!user) return res.status(404).json({error:'User not found.'});
  return res.json({user:presentUser(user)});
 } catch(error) { return next(error); }
});

adminRouter.delete('/users/:id',async(req,res,next)=>{
 try {
  const id=accountId(req.params.id);
  if(!id) return res.status(400).json({error:'Invalid user id.'});
  if(id===req.user!.id) return res.status(400).json({error:'You cannot deactivate your own account.'});
  const result=await prisma.user.updateMany({where:{id},data:{activo:false}});
  if(!result.count) return res.status(404).json({error:'User not found.'});
  return res.status(204).end();
 } catch(error) { return next(error); }
});

adminRouter.post('/users',async(req,res,next)=>{
 try {
  const data=z.object({
   name:z.string().trim().min(1).max(100),
   email:emailSchema,
   password:z.string().min(12).max(128),
   role:roleInput
  }).parse(req.body);
  const role=await prisma.role.findUnique({where:{nombre:roleNames[data.role]}});
  if(!role) return res.status(500).json({error:`The ${roleNames[data.role]} role is missing from the database.`});
  const user=await prisma.user.create({data:{nombre:data.name,email:data.email,rolId:role.id,passwordHash:await bcrypt.hash(data.password,12)},include:{rol:true}});
  return res.status(201).json({user:{id:user.id,name:user.nombre,email:user.email,role:user.rol.nombre==='Administrador'?'ADMIN':'USER',active:user.activo,createdAt:user.createdAt,_count:{contacts:0}}});
 } catch(error) { return next(error); }
});
