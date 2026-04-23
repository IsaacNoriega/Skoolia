-- Poblar planes básicos para escuelas y cursos
INSERT INTO plans (id, name, price, interval, features, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Freemium', 0, 'monthly', '["edit_course"]', now(), now()),
  (gen_random_uuid(), 'Básico', 199, 'monthly', '["edit_course", "add_files"]', now(), now()),
  (gen_random_uuid(), 'Premium', 499, 'monthly', '["edit_course", "add_files", "send_messages", "analytics"]', now(), now());

-- Plan Variable para pago por resultados
INSERT INTO plans (id, name, price, interval, features, created_at, updated_at)
VALUES (gen_random_uuid(), 'Variable', 0, 'monthly', '["lead_fee", "commission_per_enrollment", "advanced_crm", "custom_integration"]', now(), now());

-- Puedes usar los mismos planes para cursos, ya que la tabla de suscripciones de cursos referencia a plans.
-- Si necesitas planes exclusivos para cursos, repite con otros nombres o features.
