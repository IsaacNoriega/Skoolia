import 'dotenv/config';
import bcrypt from 'bcrypt';
import { inArray } from 'drizzle-orm';
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

type SeedPlan = {
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: PlanFeatures;
};

const BASE_PLANS: SeedPlan[] = [
  {
    name: 'Freemium',
    price: 0,
    interval: 'monthly',
    features: [
      'Registro gratuito',
      'Aparicion en directorio',
      'Gestion de perfil basico',
    ],
  },
  {
    name: 'Premium',
    price: 1500,
    interval: 'monthly',
    features: [
      'Aparicion en busquedas premium',
      'Panel avanzado de leads',
      'Soporte prioritario',
    ],
  },
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Seeding database...');

  await db.insert(plans).values(BASE_PLANS).onConflictDoNothing();

  const insertedPlans = await db
    .select({
      id: plans.id,
      name: plans.name,
      interval: plans.interval,
    })
    .from(plans)
    .where(inArray(plans.name, BASE_PLANS.map((plan) => plan.name)));

  const freemiumPlan = insertedPlans.find((plan) => plan.name === 'Freemium');
  const premiumPlan = insertedPlans.find((plan) => plan.name === 'Premium');

  if (!freemiumPlan || !premiumPlan) {
    throw new Error('Failed to load base subscription plans');
  }

  console.log('Base plans ready');

  const categoryList = [
    { name: 'Deportes', slug: 'Trophy' },
    { name: 'Bilingue', slug: 'Languages' },
    { name: 'Arte', slug: 'Palette' },
    { name: 'Tecnologia', slug: 'Cpu' },
    { name: 'Robotica', slug: 'Bot' },
    { name: 'Teatro', slug: 'Drama' },
    { name: 'Programacion', slug: 'Code' },
    { name: 'Para ninos', slug: 'Baby' },
    { name: 'Para hombres', slug: 'User' },
  ];

  const categorySlugs = categoryList.map((category) => category.slug);
  const hashedPassword = await bcrypt.hash('123456', 10);

  await db.insert(categories).values(categoryList).onConflictDoNothing();

  const insertedCategories = await db
    .select()
    .from(categories)
    .where(inArray(categories.slug, categorySlugs));

  console.log('Categories created');

  const ownerEmails = Array.from({ length: 15 }).map(
    (_, index) => `owner${index + 1}@test.com`,
  );

  const ownerSeedData = ownerEmails.map((email, index) => ({
    email,
    passwordHash: hashedPassword,
    name: `Owner ${index + 1}`,
  }));

  await db.insert(privateUsers).values(ownerSeedData).onConflictDoNothing();

  const ownerRows = await db
    .select({ id: privateUsers.id, email: privateUsers.email })
    .from(privateUsers)
    .where(inArray(privateUsers.email, ownerEmails));

  const ownerByEmail = new Map(ownerRows.map((owner) => [owner.email, owner]));
  const owners = ownerEmails
    .map((email) => ownerByEmail.get(email))
    .filter((owner): owner is { id: string; email: string } => Boolean(owner));

  if (owners.length !== ownerEmails.length) {
    throw new Error('Failed to load all private test users for seed');
  }

  console.log('15 private users created');

  const publicEmails = Array.from({ length: 10 }).map(
    (_, index) => `public${index + 1}@test.com`,
  );

  const publicSeedData = publicEmails.map((email, index) => ({
    email,
    passwordHash: hashedPassword,
    name: `Public ${index + 1}`,
  }));

  await db.insert(publicUsers).values(publicSeedData).onConflictDoNothing();

  const publicRows = await db
    .select({ id: publicUsers.id, email: publicUsers.email })
    .from(publicUsers)
    .where(inArray(publicUsers.email, publicEmails));

  const publicByEmail = new Map(publicRows.map((user) => [user.email, user]));
  const publics = publicEmails
    .map((email) => publicByEmail.get(email))
    .filter((user): user is { id: string; email: string } => Boolean(user));

  if (publics.length !== publicEmails.length) {
    throw new Error('Failed to load all public test users for seed');
  }

  console.log('10 public users created');

  const logoPool = Array.from({ length: 60 }).map(
    (_, index) => `https://picsum.photos/seed/skoolia-logo-${index + 1}/400/400`,
  );

  const coverPool = Array.from({ length: 60 }).map(
    (_, index) => `https://picsum.photos/seed/skoolia-cover-${index + 1}/1200/800`,
  );

  const logoUrls = owners.map((_, index) => logoPool[(index * 7) % logoPool.length]);
  const coverUrls = owners.map((_, index) => coverPool[(index * 11) % coverPool.length]);

  const logoFiles = await db
    .insert(files)
    .values(
      logoUrls.map((url, index) => ({
        url,
        key: `school-logos/logo-${index}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: Math.floor(Math.random() * 500000) + 100000,
        ownerId: owners[index].id,
        ownerType: 'school' as const,
      })),
    )
    .returning();

  const coverFiles = await db
    .insert(files)
    .values(
      coverUrls.map((url, index) => ({
        url,
        key: `school-covers/cover-${index}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: Math.floor(Math.random() * 1000000) + 500000,
        ownerId: owners[index].id,
        ownerType: 'school' as const,
      })),
    )
    .returning();

  console.log(`${logoFiles.length + coverFiles.length} files created`);

  const schoolNames = Array.from({ length: 15 }).map(
    (_, index) => `Academia ${index + 1}`,
  );

  const educationalLevels = [
    'Maternal',
    'Preescolar',
    'Primaria',
    'Secundaria',
    'Preparatoria',
    'Universidad',
  ];

  const schedules = [
    '7:30 AM - 2:30 PM',
    '8:00 AM - 3:00 PM',
    '8:30 AM - 3:30 PM',
    '7:00 AM - 2:00 PM',
    '9:00 AM - 4:00 PM',
  ];

  const languageOptions = [
    'Espanol',
    'Bilingue (Espanol-Ingles)',
    'Bilingue (Espanol-Frances)',
    'Trilingue',
    'Espanol',
  ];

  const prices = [5000, 7500, 10000, 12500, 15000, 18000, 20000];
  const institutionTypes = ['Privada', 'Publica', 'Privada', 'Privada', 'Publica'];
  const maxStudentsList = [15, 18, 20, 22, 25, 30];

  const citiesWithCoords: Array<{ city: string; lat: number; lng: number }> = [
    { city: 'Ciudad de Mexico', lat: 19.4326, lng: -99.1332 },
    { city: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
    { city: 'Monterrey', lat: 25.6866, lng: -100.3161 },
    { city: 'Puebla', lat: 19.0327, lng: -98.2364 },
    { city: 'Mexico', lat: 19.5998, lng: -99.2511 },
    { city: 'Cancun', lat: 21.1629, lng: -86.8519 },
    { city: 'Leon', lat: 21.1341, lng: -101.6826 },
    { city: 'Queretaro', lat: 20.5888, lng: -100.3899 },
  ];

  const ownerIds = owners.map((owner) => owner.id);

  await db.delete(schools).where(inArray(schools.ownerId, ownerIds));

  const insertedSchools = await db
    .insert(schools)
    .values(
      schoolNames.map((name, index) => {
        const coordsData = citiesWithCoords[index % citiesWithCoords.length];

        return {
          name,
          description: `Institucion educativa ${name} con programas academicos de calidad.`,
          city: coordsData.city,
          address: `Calle Principal ${index + 1} No. ${100 + index * 50}, ${coordsData.city}`,
          latitude: coordsData.lat + (index % 10) * 0.01,
          longitude: coordsData.lng + (index % 10) * 0.01,
          educationalLevel: educationalLevels[index % educationalLevels.length],
          institutionType: institutionTypes[index % institutionTypes.length],
          schedule: schedules[index % schedules.length],
          maxStudentsPerClass: maxStudentsList[index % maxStudentsList.length],
          languages: languageOptions[index % languageOptions.length],
          logoUrl: logoFiles[index].id,
          coverImageUrl: coverFiles[index].id,
          enrollmentYear: 2024 + (index % 3),
          monthlyPrice: prices[index % prices.length],
          enrollmentOpen: index % 2 === 0,
          averageRating: parseFloat((Math.random() * 2 + 3.5).toFixed(1)),
          ratingsCount: Math.floor(Math.random() * 50) + 10,
          favoritesCount: Math.floor(Math.random() * 100) + 5,
          rankingScore: parseFloat((Math.random() * 100).toFixed(2)),
          isFeatured: index < 5,
          ownerId: owners[index].id,
          isVerified: index % 3 === 0,
        };
      }),
    )
    .returning();

  console.log('15 schools created');

  await db.delete(schoolSubscriptions).where(
    inArray(
      schoolSubscriptions.schoolId,
      insertedSchools.map((school) => school.id),
    ),
  );

  const now = new Date();

  await db.insert(schoolSubscriptions).values(
    insertedSchools.map((school, index) => {
      const selectedPlan =
        index < Math.ceil(insertedSchools.length * 0.8)
          ? freemiumPlan
          : premiumPlan;

      const currentPeriodStart = new Date(now);
      const currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      return {
        schoolId: school.id,
        planId: selectedPlan.id,
        status: 'active' as const,
        currentPeriodStart,
        currentPeriodEnd,
      };
    }),
  );

  console.log('School subscriptions assigned');

  await db.delete(schoolCategories).where(
    inArray(
      schoolCategories.schoolId,
      insertedSchools.map((school) => school.id),
    ),
  );

  await db.insert(schoolCategories).values(
    insertedSchools.flatMap((school, index) => {
      const firstCategory = insertedCategories[index % insertedCategories.length];
      const secondCategory = insertedCategories[(index + 3) % insertedCategories.length];

      return [
        { schoolId: school.id, categoryId: firstCategory.id },
        { schoolId: school.id, categoryId: secondCategory.id },
      ];
    }),
  );

  console.log('Categories assigned');

  await db.delete(courses).where(
    inArray(
      courses.schoolId,
      insertedSchools.map((school) => school.id),
    ),
  );

  await db.insert(courses).values(
    insertedSchools.flatMap((school, index) => [
      {
        schoolId: school.id,
        name: `Curso Basico ${index + 1}`,
        description: 'Curso introductorio',
        price: 1000 + index * 100,
        capacity: 20,
        modality: 'presencial',
        status: 'published' as const,
      },
      {
        schoolId: school.id,
        name: `Curso Avanzado ${index + 1}`,
        description: 'Curso avanzado profesional',
        price: 2000 + index * 150,
        capacity: 15,
        modality: 'online',
        status: 'published' as const,
      },
    ]),
  );

  console.log('Courses created');

  const ratingsData = insertedSchools.flatMap((school) =>
    publics.slice(0, 3).map((user) => ({
      schoolId: school.id,
      publicUserId: user.id,
      rating: Math.floor(Math.random() * 5) + 1,
      comment: 'Excelente escuela!',
    })),
  );

  await db.delete(schoolRatings).where(
    inArray(
      schoolRatings.schoolId,
      insertedSchools.map((school) => school.id),
    ),
  );

  await db.insert(schoolRatings).values(ratingsData);
  console.log('Ratings created');

  await db.delete(schoolFavorites).where(
    inArray(
      schoolFavorites.schoolId,
      insertedSchools.map((school) => school.id),
    ),
  );

  await db.insert(schoolFavorites).values(
    insertedSchools.map((school) => ({
      schoolId: school.id,
      publicUserId: publics[Math.floor(Math.random() * publics.length)].id,
    })),
  );

  console.log('Favorites created');
  console.log('Seed completed successfully');

  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed');
  console.error(error);
  process.exit(1);
});
