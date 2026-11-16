import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma';
export type AppRole = 'USER' | 'ADMIN';
export interface AuthUser { id:number; role:AppRole }
declare global { namespace Express { interface Request { user?:AuthUser } } }
export async function requireAuth(req:Request,res:Response,next:NextFunction) {
 const token=req.cookies?.contact_session as string|undefined;
 if(!token) return res.status(401).json({error:'Authentication required.'});
 let payload:jwt.JwtPayload;
 try { payload=jwt.verify(token,config.jwtSecret) as jwt.JwtPayload; }
 catch { return res.status(401).json({error:'Invalid or expired session.'}); }
 if(typeof payload.sub!=='string') return res.status(401).json({error:'Invalid session.'});
 try {
  const account=await prisma.user.findFirst({where:{id:Number(payload.sub),activo:true},select:{id:true,rol:{select:{nombre:true}}}});
  if(!account) return res.status(401).json({error:'Account no longer exists or is inactive.'});
  const role:AppRole=account.rol.nombre==='Administrador'?'ADMIN':'USER';
  req.user={id:account.id,role};
  return next();
 } catch(error) { return next(error); }
}
export function requireAdmin(req:Request,res:Response,next:NextFunction) {
 if(req.user?.role!=='ADMIN') return res.status(403).json({error:'Administrator permission required.'});
 return next();
}
