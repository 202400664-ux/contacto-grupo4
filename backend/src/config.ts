import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({path:path.resolve(__dirname,'../../.env')});
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be set to at least 32 characters.');
export const config = { port:Number(process.env.API_PORT ?? 4000), jwtSecret, jwtExpiresIn:process.env.JWT_EXPIRES_IN ?? '1d', corsOrigin:process.env.API_CORS_ORIGIN ?? 'http://localhost:3000', cookieSecure:process.env.COOKIE_SECURE === 'true', isProduction:process.env.NODE_ENV === 'production' };