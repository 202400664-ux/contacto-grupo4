# Sistema de Gestión de Contactos

Aplicación web para administrar contactos personales, con Next.js, una API Express, PostgreSQL, sesiones JWT y roles de Administrador y Estándar.

## Funcionalidades

- Registro e inicio de sesión; el token se guarda en una cookie `HttpOnly`.
- CRUD de contactos con los campos de la guía: nombres, apellidos, teléfonos, correo, direcciones, género, fecha de nacimiento, relación y favorito.
- Los teléfonos aceptan exactamente ocho dígitos y el formulario agrega el guion automáticamente (`0000-0000`); el backend también valida el formato.
- Los correos se validan en frontend y backend y deben incluir `@` y un dominio con terminación válida, como `.com` o `.yahoo`.
- Cada usuario, incluso un Administrador, solo puede consultar y modificar sus propios contactos.
- Búsqueda y filtro de favoritos.
- Administración de cuentas: creación, asignación/cambio de roles y baja/reactivación de usuarios.
- Contraseñas almacenadas con hash bcrypt.

## Requisitos

- Node.js 22 o superior y npm.
- PostgreSQL 16 o superior.

## Preparar la base de datos

El esquema Prisma corresponde a las tablas `roles`, `usuarios` y `contactos` descritas en el trabajo. Si ya ejecutaste el SQL de creación en pgAdmin, conserva esas tablas y **no ejecutes `prisma migrate dev` ni `prisma migrate deploy` sobre ellas**: la migración inicial es para bases de datos nuevas y no registrará automáticamente las tablas creadas a mano.

1. En pgAdmin, confirma que la base de datos seleccionada sea `contactos` (o la que usarás) y que existan las tablas `roles`, `usuarios` y `contactos`.
2. Comprueba que `roles` tenga exactamente los nombres `Administrador` y `Estándar`.
3. En la raíz del proyecto, copia `.env.example` a `.env`.
4. Ajusta `DATABASE_URL` con el nombre de usuario y contraseña de PostgreSQL que realmente usas. Por ejemplo, si conectas como el usuario `postgres`:

   ```env
   DATABASE_URL=postgresql://postgres:TU_CLAVE@localhost:5432/contactos?schema=public
   ```

   Sustituye `TU_CLAVE` por la contraseña de PostgreSQL. No compartas ni subas el archivo `.env`.
5. Define una clave `JWT_SECRET` aleatoria de al menos 32 caracteres y una `ADMIN_PASSWORD` de al menos 12 caracteres.
6. Desde la raíz del proyecto ejecuta:

   ```bash
   npm install
   npm run db:generate
   npm run db:seed
   ```

El comando `db:seed` crea el primer administrador usando `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`. Si ese correo ya existe, no modifica la cuenta.

### Base de datos nueva

Para una base vacía (no una donde ya ejecutaste el SQL manualmente), configura `.env`, instala dependencias y ejecuta:

```bash
npm install
npm run db:deploy
npm run db:generate
npm run db:seed
```

La migración crea las tablas e inserta ambos roles. No ejecutes también el SQL manual, porque intentarías crear las mismas tablas dos veces.

## Ejecutar

Desde la raíz:

```bash
npm run dev
```

- Web: <http://localhost:3000>
- API: <http://localhost:4000/api>
- Salud de la API: <http://localhost:4000/api/health>

El primer administrador inicia sesión con el correo y la contraseña definidos en `.env`. El registro público solo crea usuarios con rol Estándar.

## Rutas principales de la API

Todas las rutas de contactos y administración requieren sesión.

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/api/auth/register` | Público; crea cuenta Estándar |
| `POST` | `/api/auth/login` | Público |
| `POST` | `/api/auth/logout` | Cierra sesión |
| `GET` | `/api/auth/me` | Sesión activa |
| `GET` | `/api/contacts?q=&favorite=true` | Sesión activa; solo contactos propios |
| `POST` | `/api/contacts` | Sesión activa |
| `PATCH` | `/api/contacts/:id` | Propietario del contacto |
| `DELETE` | `/api/contacts/:id` | Propietario del contacto |
| `PUT` / `DELETE` | `/api/contacts/:id/favorite` | Propietario del contacto |
| `GET` | `/api/admin/users` | Administrador |
| `POST` | `/api/admin/users` | Administrador; requiere rol |
| `PATCH` | `/api/admin/users/:id` | Administrador; cambia rol o estado |
| `DELETE` | `/api/admin/users/:id` | Administrador; da de baja la cuenta |

## Docker

`docker-compose.yml` está preparado para una base nueva. Configura `.env` y ejecuta:

```bash
docker compose up --build
docker compose exec api npm run db:seed --workspace=backend
```

No uses Docker sobre la base donde ya ejecutaste manualmente el SQL; el contenedor define su propio PostgreSQL.

## Publicación y defensa

Sube el proyecto al repositorio `contacto-[número_grupo]` en la rama `dev` y agrega al catedrático y al instructor como colaboradores. Para la defensa, prepara una demostración de login, roles, aislamiento de contactos por usuario, búsqueda, favoritos, administración, backend y base de datos.
