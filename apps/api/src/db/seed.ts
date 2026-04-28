import 'dotenv/config';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  categories,
  courses,
  files,
  plans,
  privateUsers,
  publicUsers,
  schoolCategories,
  schoolFavorites,
  schoolRatings,
  schoolSubscriptions,
  schools,
} from 'drizzle/schemas';

// ======================
// TIPOS
// ======================
type Level =
  | 'Universidad'
  | 'Preparatoria'
  | 'Secundaria'
  | 'Primaria'
  | 'Preescolar'
  | 'Maternal';

type SchoolProfile = {
  name: string;
  city: string;
  lat: number;
  lng: number;
  level: Level;
};

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('🧹 Limpiando base de datos...');

  await db.delete(schoolRatings);
  await db.delete(schoolFavorites);
  await db.delete(schoolCategories);
  await db.delete(schoolSubscriptions);
  await db.delete(courses);
  await db.delete(schools);
  await db.delete(files);
  await db.delete(categories);
  await db.delete(plans);
  await db.delete(privateUsers);
  await db.delete(publicUsers);

  // ======================
  // PLANES
  // ======================
  const insertedPlans = await db.insert(plans).values([
    {
      name: 'FREEMIUM' as const,
      type: 'subscription' as const,
      pricingModel: 'recurrent' as const,
      price: 0,
      features: ['Registro básico', 'Directorio'],
    },
    {
      name: 'PREMIUM_SUBSCRIPTION' as const,
      type: 'subscription' as const,
      pricingModel: 'recurrent' as const,
      price: 1500,
      features: ['Leads avanzados', 'Prioridad', 'Mapa destacado'],
    },
  ]).returning();

  const freemiumPlan = insertedPlans.find(p => p.name === 'FREEMIUM')!;
  const premiumPlan = insertedPlans.find(p => p.name === 'PREMIUM_SUBSCRIPTION')!;

  // ======================
  // CATEGORÍAS
  // ======================
  const insertedCats = await db.insert(categories).values([
    { name: 'Bilingüe', slug: 'Languages' },
    { name: 'Tecnología', slug: 'Cpu' },
    { name: 'Deportes', slug: 'Trophy' },
    { name: 'Arte y Cultura', slug: 'Palette' },
    { name: 'Robótica', slug: 'Bot' },
  ]).returning();

  // ======================
  // USUARIOS
  // ======================
  const hashedPassword = await bcrypt.hash('123456', 10);

  const owners = await db.insert(privateUsers).values(
    Array.from({ length: 15 }).map((_, i) => ({
      email: `owner${i + 1}@skoolia.com`,
      passwordHash: hashedPassword,
      name: `Director ${i + 1}`,
    }))
  ).returning();

  await db.insert(publicUsers).values(
    Array.from({ length: 10 }).map((_, i) => ({
      email: `padre${i + 1}@gmail.com`,
      passwordHash: hashedPassword,
      name: `Padre ${i + 1}`,
    }))
  );

  // ======================
  // ESCUELAS
  // ======================
  const schoolProfiles: SchoolProfile[] = [
    { name: 'Instituto Tecnológico del Sur', city: 'Tlaquepaque', lat: 20.5898, lng: -103.415, level: 'Universidad' },
    { name: 'Colegio Cervantes Bosque', city: 'Guadalajara', lat: 20.6744, lng: -103.3872, level: 'Preparatoria' },
    { name: 'American School Foundation', city: 'Guadalajara', lat: 20.686, lng: -103.381, level: 'Primaria' },
    { name: 'Kinder Tlaquepaque Mágico', city: 'Tlaquepaque', lat: 20.606, lng: -103.313, level: 'Preescolar' },
    { name: 'Secundaria Técnica 121', city: 'Zapopan', lat: 20.635, lng: -103.43, level: 'Secundaria' },

    { name: 'Colegio British de Mazatlán', city: 'Mazatlán', lat: 23.245, lng: -106.425, level: 'Primaria' },
    { name: 'Instituto Cultural de Occidente', city: 'Mazatlán', lat: 23.238, lng: -106.412, level: 'Preparatoria' },
    { name: 'Pacific National School', city: 'Mazatlán', lat: 23.272, lng: -106.446, level: 'Secundaria' },
    { name: 'Maternal Las Gaviotas', city: 'Mazatlán', lat: 23.251, lng: -106.439, level: 'Maternal' },
    { name: 'Centro Educativo Anglo', city: 'Mazatlán', lat: 23.21, lng: -106.41, level: 'Primaria' },

    { name: 'Liceo Franco Mexicano', city: 'Ciudad de México', lat: 19.432, lng: -99.202, level: 'Preparatoria' },
    { name: 'Colegio Alemán', city: 'Ciudad de México', lat: 19.248, lng: -99.163, level: 'Secundaria' },
    { name: 'Escuela Moderna Polanco', city: 'Ciudad de México', lat: 19.441, lng: -99.182, level: 'Primaria' },
    { name: 'Kinder Montessori Condesa', city: 'Ciudad de México', lat: 19.412, lng: -99.174, level: 'Preescolar' },
    { name: 'Instituto Coyoacán', city: 'Ciudad de México', lat: 19.349, lng: -99.162, level: 'Universidad' },
  ];

  console.log('🏫 Creando escuelas + cursos...');

  for (let i = 0; i < schoolProfiles.length; i++) {
    const profile = schoolProfiles[i];
    const owner = owners[i];

    // archivos escuela
    const [logo, cover] = await db.insert(files).values([
      {
        url: `https://picsum.photos/400?random=${i}`,
        key: `logo-${i}`,
        mimeType: 'image/jpeg',
        sizeBytes: 100000,
        ownerId: owner.id,
        ownerType: 'school',
      },
      {
        url: `https://picsum.photos/1200?random=${i}`,
        key: `cover-${i}`,
        mimeType: 'image/jpeg',
        sizeBytes: 500000,
        ownerId: owner.id,
        ownerType: 'school',
      },
    ]).returning();

    const state =
      profile.city === 'Mazatlán'
        ? 'Sinaloa'
        : profile.city === 'Ciudad de México'
        ? 'CDMX'
        : 'Jalisco';

    const [school] = await db.insert(schools).values({
      name: profile.name,
      description: `Escuela ${profile.name}`,
      logoUrl: logo.id,
      coverImageUrl: cover.id,
      address: `Calle ${i}`,
      city: profile.city,
      state,
      latitude: profile.lat,
      longitude: profile.lng,
      educationalLevel: profile.level,
      institutionType: i % 2 === 0 ? 'Privada' : 'Publica',
      schedule: '07:00 - 14:00',
      maxStudentsPerClass: 25,
      languages: 'Español',
      enrollmentYear: 2026,
      enrollmentOpen: true,
      monthlyPrice: 2000 + i * 100,
      averageRating: 4.5,
      ratingsCount: 10,
      favoritesCount: 5,
      rankingScore: Math.random() * 100,
      isFeatured: i < 3,
      isVerified: true,
      ownerId: owner.id,
    }).returning();

    // suscripción
    await db.insert(schoolSubscriptions).values({
      schoolId: school.id,
      planId: i % 2 === 0 ? premiumPlan.id : freemiumPlan.id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
    });

    // categoría
    await db.insert(schoolCategories).values({
      schoolId: school.id,
      categoryId: insertedCats[i % insertedCats.length].id,
    });

    // ======================
    // CURSOS POR ESCUELA 🔥
    // ======================
    const courseCovers = await db.insert(files).values([
      {
        url: `https://picsum.photos/800?random=course-${i}-1`,
        key: `course-${i}-1`,
        mimeType: 'image/jpeg',
        sizeBytes: 300000,
        ownerId: owner.id,
        ownerType: 'course',
      },
      {
        url: `https://picsum.photos/800?random=course-${i}-2`,
        key: `course-${i}-2`,
        mimeType: 'image/jpeg',
        sizeBytes: 300000,
        ownerId: owner.id,
        ownerType: 'course',
      },
    ]).returning();

    await db.insert(courses).values([
      {
        name: `Inscripción ${profile.name}`,
        description: 'Pago anual',
        price: 4000 + i * 200,
        capacity: 100,
        modality: 'presencial',
        status: 'published',
        coverImageUrl: courseCovers[0].id,
        schoolId: school.id,
        startDate: new Date(2026, 7, 1),
        endDate: new Date(2027, 6, 30),
        averageRating: 4.5,
        enrollmentsCount: 50,
        isActive: true,
      },
      {
        name: `Taller ${insertedCats[i % insertedCats.length].name}`,
        description: 'Curso extracurricular',
        price: 800,
        capacity: 25,
        modality: 'online',
        status: 'published',
        coverImageUrl: courseCovers[1].id,
        schoolId: school.id,
        startDate: new Date(2026, 8, 1),
        endDate: new Date(2027, 5, 30),
        averageRating: 4.7,
        enrollmentsCount: 20,
        isActive: true,
      },
    ]);
  }

  console.log('✅ SEED COMPLETO (escuelas + cursos)');
  await pool.end();
}

seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});