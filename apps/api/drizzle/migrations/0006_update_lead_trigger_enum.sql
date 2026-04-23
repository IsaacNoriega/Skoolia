-- Elimina el tipo anterior y crea el nuevo enum para lead_trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_trigger') THEN
        DROP TYPE "public"."lead_trigger";
    END IF;
END$$;

CREATE TYPE "public"."lead_trigger" AS ENUM ('FAVORITE', 'VIEW_MORE', 'SCHEDULE_VISIT', 'INFO_REQUEST', 'CONTACT');

-- Alterar la tabla leads para usar el nuevo enum (si es necesario)
ALTER TABLE "leads" ALTER COLUMN "last_trigger" TYPE "public"."lead_trigger" USING "last_trigger"::text::"public"."lead_trigger";