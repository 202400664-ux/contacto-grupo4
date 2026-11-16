CREATE TABLE "roles" (
  "id" SERIAL NOT NULL,
  "nombre" VARCHAR(30) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuarios" (
  "id" SERIAL NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "email" VARCHAR(150) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "rol_id" INTEGER NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contactos" (
  "id" SERIAL NOT NULL,
  "usuario_id" INTEGER NOT NULL,
  "nombres" VARCHAR(100) NOT NULL,
  "apellidos" VARCHAR(100) NOT NULL,
  "celular" VARCHAR(30),
  "telefono_fijo" VARCHAR(30),
  "correo" VARCHAR(150),
  "direccion_casa" TEXT,
  "direccion_trabajo" TEXT,
  "genero" VARCHAR(20),
  "fecha_nacimiento" DATE,
  "relacion" VARCHAR(20),
  "favorito" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contactos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contactos_genero_check" CHECK ("genero" IN ('Masculino', 'Femenino', 'Otro')),
  CONSTRAINT "contactos_relacion_check" CHECK ("relacion" IN ('Familia', 'Amigo', 'Trabajo', 'Otro'))
);

CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "idx_contactos_usuario" ON "contactos"("usuario_id");

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey"
  FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "roles" ("nombre") VALUES ('Administrador'), ('Estándar');
