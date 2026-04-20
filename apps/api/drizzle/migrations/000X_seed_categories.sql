-- Poblado inicial de categorías para onboarding
INSERT INTO categories (id, name, slug, created_at)
VALUES
  (gen_random_uuid(), 'Arte', 'arte', NOW()),
  (gen_random_uuid(), 'Deportes', 'deportes', NOW()),
  (gen_random_uuid(), 'Tecnología', 'tecnologia', NOW()),
  (gen_random_uuid(), 'Idiomas', 'idiomas', NOW()),
  (gen_random_uuid(), 'Ciencias', 'ciencias', NOW()),
  (gen_random_uuid(), 'Música', 'musica', NOW());
