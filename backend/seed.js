require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME || 'Administrador';
  const email = (process.env.ADMIN_EMAIL || 'admin@contactos.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error('Configura ADMIN_PASSWORD en .env con al menos 12 caracteres.');
  }

  const role = await prisma.role.findUnique({ where: { nombre: 'Administrador' } });
  if (!role) {
    throw new Error('No existe el rol Administrador. Ejecuta primero el SQL de creación de roles.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`El usuario administrador ${email} ya existe; no se modificó.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      nombre: name,
      email,
      passwordHash,
      rolId: role.id,
    },
  });
  console.log(`Administrador creado: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
