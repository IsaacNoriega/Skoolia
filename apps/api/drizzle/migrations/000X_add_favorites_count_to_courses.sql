-- Migration: Agregar columna favorites_count a courses
ALTER TABLE courses ADD COLUMN favorites_count INTEGER NOT NULL DEFAULT 0;
