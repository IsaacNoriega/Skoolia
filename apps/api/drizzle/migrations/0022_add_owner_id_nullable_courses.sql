-- 1. Agregar la columna como NULLABLE
ALTER TABLE "courses" ADD COLUMN "owner_id" uuid;

-- 2. (Opcional) Actualizar los cursos existentes con un owner_id válido
-- UPDATE "courses" SET "owner_id" = '<algún-uuid-existente>' WHERE "owner_id" IS NULL;

-- 3. (Después de actualizar todos los registros, puedes hacerla NOT NULL en otra migración)
-- ALTER TABLE "courses" ALTER COLUMN "owner_id" SET NOT NULL;
