import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { 
  categories, 
  plans, 
  schools, 
  privateUsers, 
  publicUsers, 
  courses, 
  schoolRatings,
  schoolSubscriptions,
  schoolCategories,
  courseCategories
} from 'drizzle/schemas';

/**
 * Script para limpiar la base de datos y poblar con datos realistas y complejos.
 * Uso: npx ts-node -r tsconfig-paths/register src/db/full-seed.ts
 */

async function fullSeed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('🗑️  1. Limpiando todas las tablas...');

  try {

    const tables = [
      'course_ratings',
      'school_categories',
      'school_favorites',
      'school_ratings',
      'school_subscriptions',
      'refresh_tokens',
      'messages',
      'threads',
      'favorites',
      'course_favorites',
      'course_subscriptions',
      'courses',
      'offers',
      'notifications',
      'students',
      'files',
      'schools',
      'public_users',
      'private_users',
      'categories',
      'plans',
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
        console.log(`   ✅ Tabla "${table}" vaciada`);
      } catch (err) {
        // Ignorar si no existe
      }
    }


    console.log('\n🌱 2. Poblando Planes...');
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
      {
        name: 'LEAD_INTEREST' as const,
        type: 'lead' as const,
        pricingModel: 'per_event' as const,
        price: 200,
        features: ['Pago por contacto calificado', 'Ideal para escuelas pequeñas'],
      },
      {
        name: 'LEAD_ENROLLMENT' as const,
        type: 'lead' as const,
        pricingModel: 'variable' as const,
        price: 1, // 1%
        features: ['Comisión por inscrito', 'Sin costo inicial'],
      },
      {
        name: 'MASS_MESSAGE' as const,
        type: 'lead' as const,
        pricingModel: 'per_event' as const,
        price: 100,
        features: ['Envío masivo a prospectos', 'Notificaciones push'],
      },
    ]).returning();

    console.log('🌱 3. Poblando Categorías...');
    const insertedCategories = await db.insert(categories).values([
      { name: 'Bilingüe', slug: 'Languages' },
      { name: 'Tecnología', slug: 'Cpu' },
      { name: 'Deportes', slug: 'Trophy' },
      { name: 'Arte y Cultura', slug: 'Palette' },
      { name: 'Robótica', slug: 'Bot' },
      { name: 'Ciencias', slug: 'FlaskConical' },
      { name: 'Música', slug: 'Music' },
      { name: 'Religioso', slug: 'Church' },
      { name: 'Matemáticas', slug: 'Calculator' },
      { name: 'Lectura', slug: 'BookOpen' },
      { name: 'Medio Ambiente', slug: 'Leaf' },
      { name: 'Negocios', slug: 'Briefcase' },
      { name: 'Salud y Bienestar', slug: 'Heart' },
      { name: 'Cocina', slug: 'ChefHat' },
      { name: 'Fotografía', slug: 'Camera' },
      { name: 'Idiomas Extranjeros', slug: 'Globe' },
    ]).returning();

    console.log('🌱 4. Poblando Usuarios...');
    const directorRecords: any[] = [];
    const parentRecords: any[] = [];

    for (let i = 0; i < 20; i++) {
      directorRecords.push({
        name: `Director ${i + 1}`,
        email: i === 0 ? 'admin@skoolia.com' : (i === 1 ? 'director@escuela.com' : `director${i}@skoolia.com`),
        passwordHash,
      });
      parentRecords.push({
        name: `Padre ${i + 1}`,
        email: i === 0 ? 'juan@gmail.com' : (i === 1 ? 'maria@gmail.com' : `padre${i}@gmail.com`),
        passwordHash,
      });
    }

    const directors = await db.insert(privateUsers).values(directorRecords).returning();
    const parents = await db.insert(publicUsers).values(parentRecords).returning();

    console.log('🌱 5. Poblando Escuelas y sus Categorías...');
    const cities = [
      { city: 'Guadalajara', state: 'Jalisco', lat: 20.6597, lng: -103.3496 },
      { city: 'Zapopan', state: 'Jalisco', lat: 20.7236, lng: -103.3848 },
      { city: 'Ciudad de México', state: 'CDMX', lat: 19.4326, lng: -99.1332 },
      { city: 'Monterrey', state: 'Nuevo León', lat: 25.6866, lng: -100.3161 },
      { city: 'Querétaro', state: 'Querétaro', lat: 20.5888, lng: -100.3899 },
      { city: 'Cancún', state: 'Quintana Roo', lat: 21.1619, lng: -86.8515 },
      { city: 'Puebla', state: 'Puebla', lat: 19.0413, lng: -98.2062 },
      { city: 'Mérida', state: 'Yucatán', lat: 20.9674, lng: -89.5926 },
    ];

    const schoolNames = [
      'Instituto', 'Colegio', 'Academy', 'Escuela', 'Liceo', 'Centro Educativo', 'Centro de Artes', 'Tech Institute'
    ];
    const adjectives = [
      'Moderno', 'Internacional', 'del Sol', 'Británico', 'Montessori', 'San Juan', 'de Innovación', 'Creativo'
    ];

    const schoolRecords: any[] = [];
    for (let i = 0; i < 20; i++) {
      const cityData = cities[i % cities.length];
      const name = `${schoolNames[i % schoolNames.length]} ${adjectives[Math.floor(i / 2) % adjectives.length]} ${cityData.city}`;
      schoolRecords.push({
        name,
        description: `Institución líder en ${cityData.city} enfocada en formación integral y excelencia en ${name.split(' ')[0]}.`,
        address: `Calle ${i + 10} # ${100 + i}, Col. Centro`,
        city: cityData.city,
        state: cityData.state,
        latitude: cityData.lat + (Math.random() - 0.5) * 0.1,
        longitude: cityData.lng + (Math.random() - 0.5) * 0.1,
        lat: cityData.lat + (Math.random() - 0.5) * 0.1, // Duplicar para compatibilidad
        lng: cityData.lng + (Math.random() - 0.5) * 0.1, // Duplicar para compatibilidad
        educationalLevel: i % 3 === 0 ? 'K-12' : (i % 2 === 0 ? 'Primaria/Secundaria' : 'Bachillerato'),
        institutionType: 'Privada',
        ownerId: directors[i % directors.length].id,
        isVerified: i % 2 === 0,
        isFeatured: i % 5 === 0,
        monthlyPrice: 1500 + (i * 200),
        coverImageUrl: `https://picsum.photos/seed/school-${i}/1200/800`
      });
    }

    const insertedSchools = await db.insert(schools).values(schoolRecords).returning();

    // Asignar categorías a escuelas
    const schoolCategoryAssignments: any[] = [];
    for (const school of insertedSchools) {
      // 2-3 categorías por escuela
      const shuffled = [...insertedCategories].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
      for (const cat of selected) {
        schoolCategoryAssignments.push({
          schoolId: school.id,
          categoryId: cat.id
        });
      }
    }
    await db.insert(schoolCategories).values(schoolCategoryAssignments);

    console.log('🌱 6. Poblando Cursos y sus Categorías...');
    const courseTypes = [
      'Robótica', 'Programación', 'Pintura', 'Piano', 'Guitarra', 'Inglés', 'Francés', 'Alemán', 
      'Matemáticas', 'Física', 'Yoga', 'Danza', 'Marketing', 'Cocina', 'Fotografía', 'Ajedrez'
    ];
    const courseLevels = ['Básico', 'Intermedio', 'Avanzado', 'Masterclass'];

    const courseRecords: any[] = [];
    // 45 cursos vinculados a escuelas
    for (let i = 0; i < 45; i++) {
      const type = courseTypes[i % courseTypes.length];
      const level = courseLevels[Math.floor(i / courseTypes.length)];
      const school = insertedSchools[i % insertedSchools.length];
      courseRecords.push({
        name: `${type} ${level}`,
        description: `Un curso completo de ${type} diseñado para estudiantes de nivel ${level}.`,
        price: 800 + (i * 100),
        schoolId: school.id,
        ownerId: school.ownerId,
        modality: i % 3 === 0 ? 'Online' : (i % 2 === 0 ? 'Presencial' : 'Híbrido'),
        status: 'published' as const,
        capacity: 10 + (i % 20),
        coverImageUrl: `https://picsum.photos/seed/course-${i}/800/600`
      });
    }

    // 15 cursos independientes
    for (let i = 0; i < 15; i++) {
      const type = courseTypes[(i + 5) % courseTypes.length];
      courseRecords.push({
        name: `${type} Independiente`,
        description: `Curso especializado de ${type} impartido por expertos independientes.`,
        price: 1500 + (i * 150),
        ownerId: directors[i % directors.length].id,
        modality: i % 2 === 0 ? 'Online' : 'Presencial',
        status: 'published' as const,
        capacity: 50,
        city: cities[i % cities.length].city,
        coverImageUrl: `https://picsum.photos/seed/indep-${i}/800/600`
      });
    }

    const insertedCourses = await db.insert(courses).values(courseRecords).returning();

    // Asignar categorías a cursos
    const courseCategoryAssignments: any[] = [];
    for (const course of insertedCourses) {
      // 1-2 categorías por curso
      const shuffled = [...insertedCategories].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 1 + Math.floor(Math.random() * 2));
      for (const cat of selected) {
        courseCategoryAssignments.push({
          courseId: course.id,
          categoryId: cat.id
        });
      }
    }
    await db.insert(courseCategories).values(courseCategoryAssignments);

    console.log('🌱 7. Poblando Calificaciones...');
    const ratingRecords: any[] = [];
    // Un rating por escuela para evitar duplicados de (school_id, public_user_id)
    for (let i = 0; i < insertedSchools.length; i++) {
      ratingRecords.push({
        schoolId: insertedSchools[i].id,
        publicUserId: parents[i % parents.length].id,
        rating: 4 + (i % 2 === 0 ? 1 : 0),
        comment: i % 3 === 0 ? '¡Excelente institución!' : 'Muy recomendada, gran ambiente.',
      });
    }
    await db.insert(schoolRatings).values(ratingRecords);

    console.log('🌱 8. Poblando Suscripciones Activas...');
    const premiumPlanId = insertedPlans.find(p => p.name === 'PREMIUM_SUBSCRIPTION')!.id;
    const freePlanId = insertedPlans.find(p => p.name === 'FREEMIUM')!.id;

    const subscriptionRecords: any[] = [];
    for (let i = 0; i < insertedSchools.length; i++) {
      subscriptionRecords.push({
        schoolId: insertedSchools[i].id,
        planId: i % 3 === 0 ? premiumPlanId : freePlanId,
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + (i % 2 === 0 ? 30 : 365) * 24 * 60 * 60 * 1000)
      });
    }
    await db.insert(schoolSubscriptions).values(subscriptionRecords);

    console.log('\n✨ ¡Seed masivo completado con éxito!');
    console.log(`   Escuelas creadas: ${insertedSchools.length}`);
    console.log(`   Cursos creados: ${courseRecords.length}`);

  } catch (err) {
    console.error('\n❌ Error durante el seed:');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fullSeed();
