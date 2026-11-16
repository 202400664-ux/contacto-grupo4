import { z } from 'zod';

const emailPattern=/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const emailSchema=z.string()
 .trim()
 .email()
 .regex(emailPattern,'El correo debe incluir @ y un dominio válido, por ejemplo .com o .yahoo.')
 .max(150)
 .transform(value=>value.toLowerCase());

export const optionalPhoneSchema=z.union([
 z.string().regex(/^\d{4}-\d{4}$/,'El teléfono debe tener 8 dígitos en formato 0000-0000.'),
 z.literal('')
]).optional().nullable().transform(value=>value||null);
