import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { config } from '../config';
import { requireAuth } from '../middleware/auth';
import { emailSchema } from '../validation';

export const authRouter=Router();
const credentials=z.object({email:emailSchema,password:z.string().min(1).max(128)});
const registration=credentials.extend({name:z.string().trim().min(1).max(100),password:z.string().min(12).max(128)});
const cookieOptions={httpOnly:true,secure:config.cookieSecure,sameSite:'lax' as const,path:'/',maxAge:24*60*60*1000};

function publicUser(user:{id:number;nombre:string;email:string;rol:{nombre:string}}) {
 return {id:user.id,name:user.nombre,email:user.email,role:user.rol.nombre==='Administrador'?'ADMIN':'USER'};
}

function setSession(res:Response,user:{id:number}) {
 const token=jwt.sign({},config.jwtSecret,{subject:String(user.id),expiresIn:config.jwtExpiresIn as jwt.SignOptions['expiresIn']});
 res.cookie('contact_session',token,cookieOptions);
}

authRouter.post('/register',async(req,res,next)=>{
 try {
  const data=registration.parse(req.body);
  const role=await prisma.role.findUnique({where:{nombre:'Estándar'}});
  if(!role) return res.status(500).json({error:'The Estándar role is missing from the database.'});
  const user=await prisma.user.create({data:{nombre:data.name,email:data.email,passwordHash:await bcrypt.hash(data.password,12),rolId:role.id},include:{rol:true}});
  setSession(res,user);
  return res.status(201).json({user:publicUser(user)});
 } catch(error) { return next(error); }
});

authRouter.post('/login',async(req,res,next)=>{
 try {
  const data=credentials.parse(req.body);
  const user=await prisma.user.findUnique({where:{email:data.email},include:{rol:true}});
  if(!user||!user.activo||!(await bcrypt.compare(data.password,user.passwordHash))) return res.status(401).json({error:'Email or password is incorrect.'});
  setSession(res,user);
  return res.json({user:publicUser(user)});
 } catch(error) { return next(error); }
});

authRouter.post('/logout',(_req,res)=>{
 res.clearCookie('contact_session',{httpOnly:true,secure:config.cookieSecure,sameSite:'lax',path:'/'});
 res.status(204).end();
});

authRouter.get('/me',requireAuth,async(req,res,next)=>{
 try {
  const user=await prisma.user.findFirst({where:{id:req.user!.id,activo:true},include:{rol:true}});
  if(!user) return res.status(401).json({error:'Account no longer exists or is inactive.'});
  return res.json({user:publicUser(user)});
 } catch(error) { return next(error); }
});
