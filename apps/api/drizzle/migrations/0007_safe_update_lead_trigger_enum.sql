-- Migración segura para actualizar el enum lead_trigger en PostgreSQL
-- 1. Cambia la columna a text temporalmente
ALTER TABLE "leads" ALTER COLUMN "last_trigger" TYPE text;

-- 2. Elimina el tipo ENUM anterior (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_trigger') THEN
        DROP TYPE "public"."lead_trigger";
    END IF;
END$$;

-- 3. Crea el nuevo tipo ENUM
CREATE TYPE "public"."lead_trigger" AS ENUM ('FAVORITE', 'VIEW_MORE', 'SCHEDULE_VISIT', 'INFO_REQUEST', 'CONTACT');

-- 4. Convierte la columna de nuevo al tipo ENUM
ALTER TABLE "leads" ALTER COLUMN "last_trigger" TYPE "public"."lead_trigger" USING "last_trigger"::text::"public"."lead_trigger";