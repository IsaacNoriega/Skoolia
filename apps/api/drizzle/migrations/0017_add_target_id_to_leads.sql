-- Agrega la columna target_id de tipo UUID a la tabla leads
ALTER TABLE leads ADD COLUMN target_id UUID NOT NULL;