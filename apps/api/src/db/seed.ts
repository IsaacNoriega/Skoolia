import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { inArray } from 'drizzle-orm';
import { privateUsers } from '../../drizzle/schemas/users/private-users';
import { publicUsers } from '../../drizzle/schemas/users/public-users';
import { schools } from '../../drizzle/schemas/schools/school';
import { categories } from 'drizzle/schemas';
import { schoolCategories } from '../../drizzle/schemas/schools/school-categories.pivot';
import { courses } from '../../drizzle/schemas/courses/courses';
import { schoolRatings } from '../../drizzle/schemas/schools/school-ratings';
import { schoolFavorites } from '../../drizzle/schemas/schools/school-favorites';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🌱 Seeding database...');

  // ==============================
  // 1️⃣ CATEGORIES
  // ==============================

  const categoryList = [
    { name: 'Deportes', slug: 'Trophy' },
    { name: 'Bilingue', slug: 'Languages' },
    { name: 'Arte', slug: 'Palette' },
    { name: 'Tecnología', slug: 'Cpu' },
    { name: 'Robótica', slug: 'Bot' },
    { name: 'Teatro', slug: 'Drama' },
    { name: 'Programación', slug: 'Code' },
    { name: 'Para niños', slug: 'Baby' },
    { name: 'Para hombres', slug: 'User' },
  ];

  const categorySlugs = categoryList.map((c) => c.slug);

  const hashedPassword = await bcrypt.hash('123456', 10);

  await db.insert(categories).values(categoryList).onConflictDoNothing();

  const insertedCategories = await db
    .select()
    .from(categories)
    .where(inArray(categories.slug, categorySlugs));

  console.log('✅ Categories created');

  // ==============================
  // 2️⃣ PRIVATE USERS
  // ==============================

  const ownerEmails = Array.from({ length: 15 }).map(
    (_, i) => `owner${i + 1}@test.com`,
  );

  const ownerSeedData = ownerEmails.map((email, i) => ({
    email,
    passwordHash: hashedPassword,
    name: `Owner ${i + 1}`,
  }));

  await db.insert(privateUsers).values(ownerSeedData).onConflictDoNothing();

  const ownerRows = await db
    .select({ id: privateUsers.id, email: privateUsers.email })
    .from(privateUsers)
    .where(inArray(privateUsers.email, ownerEmails));

  const ownerByEmail = new Map(ownerRows.map((o) => [o.email, o]));
  const owners = ownerEmails
    .map((email) => ownerByEmail.get(email))
    .filter((o): o is { id: string; email: string } => Boolean(o));

  if (owners.length !== ownerEmails.length) {
    throw new Error('Failed to load all private test users for seed');
  }

  console.log('✅ 15 private users created');

  // ==============================
  // 3️⃣ PUBLIC USERS
  // ==============================

  const publicEmails = Array.from({ length: 10 }).map(
    (_, i) => `public${i + 1}@test.com`,
  );

  const publicSeedData = publicEmails.map((email, i) => ({
    email,
    passwordHash: hashedPassword,
    name: `Public ${i + 1}`,
  }));

  await db.insert(publicUsers).values(publicSeedData).onConflictDoNothing();

  const publicRows = await db
    .select({ id: publicUsers.id, email: publicUsers.email })
    .from(publicUsers)
    .where(inArray(publicUsers.email, publicEmails));

  const publicByEmail = new Map(publicRows.map((u) => [u.email, u]));
  const publics = publicEmails
    .map((email) => publicByEmail.get(email))
    .filter((u): u is { id: string; email: string } => Boolean(u));

  if (publics.length !== publicEmails.length) {
    throw new Error('Failed to load all public test users for seed');
  }

  console.log('✅ 10 public users created');

  // ==============================
  // 4️⃣ SCHOOLS
  // ==============================

  const schoolNames = Array.from({ length: 15 }).map(
    (_, i) => `Academia ${i + 1}`,
  );

  const educationalLevels = [
    'Maternal',
    'Preescolar',
    'Primaria',
    'Secundaria',
    'Preparatoria',
    'Universidad',
  ];

  const mexicoStates = [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de Mexico',
    'Coahuila',
    'Colima',
    'Durango',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'Mexico',
    'Michoacan',
    'Morelos',
    'Nayarit',
    'Nuevo Leon',
    'Oaxaca',
    'Puebla',
    'Queretaro',
    'Quintana Roo',
    'San Luis Potosi',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatan',
    'Zacatecas',
  ];

  const schedules = [
    '7:30 AM - 2:30 PM',
    '8:00 AM - 3:00 PM',
    '8:30 AM - 3:30 PM',
    '7:00 AM - 2:00 PM',
    '9:00 AM - 4:00 PM',
  ];

  const languageOptions = [
    'Español',
    'Bilingüe (Español-Inglés)',
    'Bilingüe (Español-Francés)',
    'Trilingüe',
    'Español',
  ];

  const prices = [5000, 7500, 10000, 12500, 15000, 18000, 20000];

  const ownerIds = owners.map((o) => o.id);

  await db.delete(schools).where(inArray(schools.ownerId, ownerIds));

  const insertedSchools = await db
    .insert(schools)
    .values(
      schoolNames.map((name, i) => ({
        name,
        description: `Descripcion profesional de ${name}`,
        city: mexicoStates[i % mexicoStates.length],
        educationalLevel: educationalLevels[i % educationalLevels.length],
        schedule: schedules[i % schedules.length],
        languages: languageOptions[i % languageOptions.length],
        monthlyPrice: prices[i % prices.length],
        enrollmentOpen: i % 2 === 0,
        ownerId: owners[i].id,
        isVerified: i % 3 === 0,
      })),
    )
    .returning();

  console.log('✅ 15 schools created');

  // ==============================
  // 5️⃣ SCHOOL CATEGORIES
  // ==============================

  await db.delete(schoolCategories).where(
    inArray(
      schoolCategories.schoolId,
      insertedSchools.map((s) => s.id),
    ),
  );

  await db.insert(schoolCategories).values(
    insertedSchools.flatMap((school, i) => {
      const firstCategory = insertedCategories[i % insertedCategories.length];
      const secondCategory =
        insertedCategories[(i + 3) % insertedCategories.length];

      return [
        {
          schoolId: school.id,
          categoryId: firstCategory.id,
        },
        {
          schoolId: school.id,
          categoryId: secondCategory.id,
        },
      ];
    }),
  );

  console.log('✅ Categories assigned');

  // ==============================
  // 6️⃣ COURSES (2 per school)
  // ==============================

  await db.delete(courses).where(
    inArray(
      courses.schoolId,
      insertedSchools.map((s) => s.id),
    ),
  );

  await db.insert(courses).values(
    insertedSchools.flatMap((school, i) => [
      {
        schoolId: school.id,
        name: `Curso Basico ${i + 1}`,
        description: 'Curso introductorio',
        price: 1000 + i * 100,
        capacity: 20,
        modality: 'presencial',
        status: 'published' as const,
      },
      {
        schoolId: school.id,
        name: `Curso Avanzado ${i + 1}`,
        description: 'Curso avanzado profesional',
        price: 2000 + i * 150,
        capacity: 15,
        modality: 'online',
        status: 'published' as const,
      },
    ]),
  );

  console.log('✅ Courses created');

  // ==============================
  // 7️⃣ RATINGS (1 per user per school)
  // ==============================

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
      insertedSchools.map((s) => s.id),
    ),
  );

  await db.insert(schoolRatings).values(ratingsData);
  console.log('✅ Ratings created');

  // ==============================
  // 8️⃣ FAVORITES
  // ==============================

  await db.delete(schoolFavorites).where(
    inArray(
      schoolFavorites.schoolId,
      insertedSchools.map((s) => s.id),
    ),
  );

  await db.insert(schoolFavorites).values(
    insertedSchools.map((school) => ({
      schoolId: school.id,
      publicUserId: publics[Math.floor(Math.random() * publics.length)].id,
    })),
  );

  console.log('✅ Favorites created');

  console.log('🎉 SEED COMPLETED SUCCESSFULLY');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed');
  console.error(err);
  process.exit(1);
});
