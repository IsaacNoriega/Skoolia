import 'dotenv/config';
import bcrypt from 'bcrypt';
import { inArray, sql } from 'drizzle-orm';
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
  type PlanFeatures,
} from 'drizzle/schemas';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('🚀 Iniciando limpieza de base de datos...');

  // Limpieza en orden de dependencia
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

  console.log('✅ Base de datos limpia.');

  // 1. PLANES
  const BASE_PLANS: any[] = [
    {
      name: 'Freemium',
      price: 0,
      interval: 'monthly',
      features: ['Registro básico', 'Directorio'],
    },
    {
      name: 'Premium',
      price: 1500,
      interval: 'monthly',
      features: ['Leads avanzados', 'Prioridad', 'Mapa destacado'],
    },
  ];
  const insertedPlans = await db.insert(plans).values(BASE_PLANS).returning();
  const freemiumPlan = insertedPlans.find(p => p.name === 'Freemium')!;
  const premiumPlan = insertedPlans.find(p => p.name === 'Premium')!;

  // 2. CATEGORÍAS
  const categoryList = [
    { name: 'Bilingüe', slug: 'Languages' },
    { name: 'Tecnología', slug: 'Cpu' },
    { name: 'Deportes', slug: 'Trophy' },
    { name: 'Arte y Cultura', slug: 'Palette' },
    { name: 'Robótica', slug: 'Bot' },
  ];
  const insertedCats = await db
    .insert(categories)
    .values(categoryList)
    .returning();

  // 3. USUARIOS (15 Owners y 10 Públicos)
  const hashedPassword = await bcrypt.hash('123456', 10);
  const ownerData = Array.from({ length: 15 }).map((_, i) => ({
    email: `owner${i + 1}@skoolia.com`,
    passwordHash: hashedPassword,
    name: `Director Académico ${i + 1}`,
  }));
  const owners = await db.insert(privateUsers).values(ownerData).returning();

  const publicData = Array.from({ length: 10 }).map((_, i) => ({
    email: `padre${i + 1}@gmail.com`,
    passwordHash: hashedPassword,
    name: `Padre de Familia ${i + 1}`,
  }));
  const publics = await db.insert(publicUsers).values(publicData).returning();

  // 4. GENERACIÓN DE ESCUELAS POR ESTADO
  // Dividimos las 15 escuelas: 5 Jalisco, 5 Sinaloa, 5 CDMX
  const schoolProfiles = [
    // --- JALISCO (Cerca del ITESO / Tlaquepaque) ---
    {
      name: 'Instituto Tecnológico del Sur',
      city: 'Tlaquepaque',
      lat: 20.5898,
      lng: -103.415,
      level: 'Universidad',
    },
    {
      name: 'Colegio Cervantes Bosque',
      city: 'Guadalajara',
      lat: 20.6744,
      lng: -103.3872,
      level: 'Preparatoria',
    },
    {
      name: 'American School Foundation',
      city: 'Guadalajara',
      lat: 20.686,
      lng: -103.381,
      level: 'Primaria',
    },
    {
      name: 'Kinder Tlaquepaque Mágico',
      city: 'Tlaquepaque',
      lat: 20.606,
      lng: -103.313,
      level: 'Preescolar',
    },
    {
      name: 'Secundaria Técnica 121',
      city: 'Zapopan',
      lat: 20.635,
      lng: -103.43,
      level: 'Secundaria',
    },

    // --- SINALOA (Mazatlán) ---
    {
      name: 'Colegio British de Mazatlán',
      city: 'Mazatlán',
      lat: 23.245,
      lng: -106.425,
      level: 'Primaria',
    },
    {
      name: 'Instituto Cultural de Occidente',
      city: 'Mazatlán',
      lat: 23.238,
      lng: -106.412,
      level: 'Preparatoria',
    },
    {
      name: 'Pacific National School',
      city: 'Mazatlán',
      lat: 23.272,
      lng: -106.446,
      level: 'Secundaria',
    },
    {
      name: 'Maternal Las Gaviotas',
      city: 'Mazatlán',
      lat: 23.251,
      lng: -106.439,
      level: 'Maternal',
    },
    {
      name: 'Centro Educativo Anglo',
      city: 'Mazatlán',
      lat: 23.21,
      lng: -106.41,
      level: 'Primaria',
    },

    // --- CDMX ---
    {
      name: 'Liceo Franco Mexicano',
      city: 'Ciudad de México',
      lat: 19.432,
      lng: -99.202,
      level: 'Preparatoria',
    },
    {
      name: 'Colegio Alemán Alexander von Humboldt',
      city: 'Ciudad de México',
      lat: 19.248,
      lng: -99.163,
      level: 'Secundaria',
    },
    {
      name: 'Escuela Moderna Polanco',
      city: 'Ciudad de México',
      lat: 19.441,
      lng: -99.182,
      level: 'Primaria',
    },
    {
      name: 'Kinder Montessori Condesa',
      city: 'Ciudad de México',
      lat: 19.412,
      lng: -99.174,
      level: 'Preescolar',
    },
    {
      name: 'Instituto Coyoacán',
      city: 'Ciudad de México',
      lat: 19.349,
      lng: -99.162,
      level: 'Universidad',
    },
  ];

  console.log('🖼️ Generando archivos y perfiles de escuelas...');

  for (let i = 0; i < schoolProfiles.length; i++) {
    const profile = schoolProfiles[i];
    const owner = owners[i];

    // Crear archivos (Logo y Portada) usando imágenes de Unsplash
    const unsplashLogos = [
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400&q=80',
      'https://images.unsplash.com/photo-1503676382389-4809596d5290?w=400&q=80',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400&q=80',
      'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=400&q=80',
      'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&q=80',
    ];
    const unsplashCovers = [
      'https://images.unsplash.com/photo-1523050335392-93851179ae22?q=80&w=1200',
      'https://images.unsplash.com/photo-1465101178521-c1a9136a3fd9?q=80&w=1200',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=1200',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200',
      'https://images.unsplash.com/photo-1464983953574-0892a716854b?q=80&w=1200',
    ];
    const [logo, cover] = await db
      .insert(files)
      .values([
        {
          url: unsplashLogos[i % unsplashLogos.length],
          key: `logos/logo-${i}.jpg`,
          mimeType: 'image/jpeg',
          sizeBytes: 150000,
          ownerId: owner.id,
          ownerType: 'school',
        },
        {
          url: unsplashCovers[i % unsplashCovers.length],
          key: `covers/cover-${i}.jpg`,
          mimeType: 'image/jpeg',
          sizeBytes: 800000,
          ownerId: owner.id,
          ownerType: 'school',
        },
      ])
      .returning();

    // Crear Escuela con TODOS los campos
    const state = profile.city === 'Mazatlán'
      ? 'Sinaloa'
      : profile.city === 'Ciudad de México'
      ? 'Ciudad de Mexico'
      : ['Guadalajara', 'Zapopan', 'Tlaquepaque'].includes(profile.city)
      ? 'Jalisco'
      : '';

    const [school] = await db
      .insert(schools)
      .values({
        name: profile.name,
        description: `Bienvenido a ${profile.name}. Líderes en el estado de ${state}. Contamos con instalaciones modernas y un enfoque en valores.`,
        logoUrl: logo.id,
        coverImageUrl: cover.id,
        address: `Av. Educación No. ${100 + i}, Col. Centro`,
        city: profile.city,
        state,
        latitude: profile.lat,
        longitude: profile.lng,
        lat: profile.lat, // Por si usas float
        lng: profile.lng, // Por si usas float
        educationalLevel: profile.level,
        institutionType: i % 2 === 0 ? 'Privada' : 'Publica',
        schedule: '07:30 AM - 02:30 PM',
        maxStudentsPerClass: 25,
        languages: i % 3 === 0 ? 'Bilingüe (Español-Inglés)' : 'Español',
        enrollmentYear: 2026,
        enrollmentOpen: true,
        monthlyPrice: 2500 + i * 450,
        averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        ratingsCount: Math.floor(Math.random() * 40) + 5,
        favoritesCount: Math.floor(Math.random() * 20),
        rankingScore: Math.random() * 100,
        isFeatured: i < 3,
        isVerified: true,
        ownerId: owner.id,
      })
      .returning();

    // Suscripción
    await db.insert(schoolSubscriptions).values({
      schoolId: school.id,
      planId: i % 5 === 0 ? premiumPlan.id : freemiumPlan.id,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Categorías (Robótica para todos los pares, Deportes para impares) evitando duplicados
    const categoryIds = [
      insertedCats[i % insertedCats.length].id,
      insertedCats[4].id, // Robótica
    ].filter((id, idx, arr) => arr.indexOf(id) === idx);

    await db.insert(schoolCategories).values(
      categoryIds.map((categoryId) => ({
        schoolId: school.id,
        categoryId,
      })),
    );

    // Cursos
    await db.insert(courses).values([
      {
        schoolId: school.id,
        name: `Inscripción Anual ${profile.level}`,
        description: 'Cubre gastos administrativos y seguro escolar.',
        price: 4500,
        capacity: 100,
        modality: 'presencial',
        status: 'published',
      },
      {
        schoolId: school.id,
        name: 'Taller de Robótica Avanzada',
        description: 'Competencias nacionales e internacionales.',
        price: 850,
        capacity: 20,
        modality: 'presencial',
        status: 'published',
      },
    ]);

    // Ratings (Padres comentando)
    await db.insert(schoolRatings).values({
      schoolId: school.id,
      publicUserId: publics[i % publics.length].id,
      rating: 5,
      comment: '¡Excelente nivel académico y atención de los profesores!',
    });
  }

  console.log(
    '✅ SEED COMPLETADO: 15 Escuelas en 3 Estados creadas con éxito.',
  );
  await pool.end();
}

seed().catch((e) => {
  console.error('❌ Error en el seed:', e);
  process.exit(1);
});
