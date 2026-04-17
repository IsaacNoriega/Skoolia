-- Corrige la columna owner_id para que sea nullable
ALTER TABLE "courses" DROP COLUMN IF EXISTS "owner_id";
ALTER TABLE "courses" ADD COLUMN "owner_id" uuid;
-- Ahora puedes poblar los datos y luego hacerla NOT NULL si lo deseas
