-- Agrega el valor 'INSCRIBIRME' al enum lead_trigger en PostgreSQL de forma segura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'lead_trigger' AND e.enumlabel = 'INSCRIBIRME'
    ) THEN
        ALTER TYPE "public"."lead_trigger" ADD VALUE 'INSCRIBIRME';
    END IF;
END$$;
