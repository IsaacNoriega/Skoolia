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
  schoolSubscriptions
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
    await db.execute(sql`SET session_replication_role = 'replica'`);

    const tables = [
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

    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log('\n🌱 2. Poblando Planes...');
    const insertedPlans = await db.insert(plans).values([
      {
        name: 'FREEMIUM',
        type: 'subscription',
        pricingModel: 'recurrent',
        price: 0,
        features: ['Registro básico', 'Directorio'],
      },
      {
        name: 'PREMIUM_SUBSCRIPTION',
        type: 'subscription',
        pricingModel: 'recurrent',
        price: 1500,
        features: ['Leads avanzados', 'Prioridad', 'Mapa destacado'],
      },
      {
        name: 'LEAD_INTEREST',
        type: 'lead',
        pricingModel: 'per_event',
        price: 200,
        features: ['Pago por contacto calificado'],
      }
    ]).returning();

    console.log('🌱 3. Poblando Categorías...');
    await db.insert(categories).values([
      { name: 'Bilingüe', slug: 'Languages' },
      { name: 'Tecnología', slug: 'Cpu' },
      { name: 'Deportes', slug: 'Trophy' },
      { name: 'Arte y Cultura', slug: 'Palette' },
    ]);

    console.log('🌱 4. Poblando Usuarios...');
    const [admin1, admin2] = await db.insert(privateUsers).values([
      { name: 'Admin Skoolia', email: 'admin@skoolia.com', passwordHash },
      { name: 'Escuela Director', email: 'director@escuela.com', passwordHash },
    ]).returning();

    const [user1, user2] = await db.insert(publicUsers).values([
      { name: 'Juan Perez', email: 'juan@gmail.com', passwordHash },
      { name: 'Maria Lopez', email: 'maria@gmail.com', passwordHash },
    ]).returning();

    console.log('🌱 5. Poblando Escuelas...');
    const [school1, school2] = await db.insert(schools).values([
      {
        name: 'Instituto Moderno',
        description: 'Una escuela enfocada en la excelencia académica y el desarrollo tecnológico.',
        address: 'Av. Vallarta 123, Guadalajara',
        city: 'Guadalajara',
        state: 'Jalisco',
        latitude: 20.6744,
        longitude: -103.3873,
        lat: 20.6744,
        lng: -103.3873,
        educationalLevel: 'Primaria/Secundaria',
        institutionType: 'Privada',
        ownerId: admin1.id,
        isVerified: true,
        isFeatured: true,
        monthlyPrice: 3500,
        logoUrl: 'https://picsum.photos/seed/school-1-logo/200/200',
        coverImageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200'
      },
      {
        name: 'Academy of Arts',
        description: 'Líderes en formación artística y musical en la región.',
        address: 'Calle Libertad 456, Zapopan',
        city: 'Zapopan',
        state: 'Jalisco',
        latitude: 20.7204,
        longitude: -103.3913,
        lat: 20.7204,
        lng: -103.3913,
        educationalLevel: 'Bachillerato',
        institutionType: 'Privada',
        ownerId: admin2.id,
        isVerified: true,
        monthlyPrice: 1800,
        logoUrl: 'https://picsum.photos/seed/school-2-logo/200/200',
        coverImageUrl: 'https://images.unsplash.com/photo-1523050335392-9bc56753f17c?auto=format&fit=crop&q=80&w=1200'
      }
    ]).returning();

    console.log('🌱 6. Poblando Cursos...');
    // Cursos vinculados a escuelas
    await db.insert(courses).values([
      {
        name: 'Robótica Avanzada',
        description: 'Construye y programa tus propios robots con Arduino y LEGO.',
        price: 3500,
        schoolId: school1.id,
        ownerId: admin1.id,
        modality: 'Presencial',
        status: 'published',
        capacity: 20,
        coverImageUrl: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Inglés Intensivo',
        description: 'Preparación para certificación TOEFL y Cambridge.',
        price: 2500,
        schoolId: school1.id,
        ownerId: admin1.id,
        modality: 'Híbrido',
        status: 'published',
        capacity: 15,
        coverImageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Pintura al Óleo',
        description: 'Técnicas clásicas y modernas de pintura.',
        price: 1800,
        schoolId: school2.id,
        ownerId: admin2.id,
        modality: 'Presencial',
        status: 'published',
        capacity: 12,
        coverImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800'
      }
    ]);

    // Cursos independientes
    await db.insert(courses).values([
      {
        name: 'Marketing Digital Pro',
        description: 'Domina las redes sociales y el SEO en 12 semanas.',
        price: 4500,
        ownerId: admin1.id,
        modality: 'Online',
        status: 'published',
        capacity: 100,
        coverImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Cocina Mediterránea',
        description: 'Aprende los secretos de la dieta más saludable del mundo.',
        price: 1200,
        ownerId: admin2.id,
        modality: 'Presencial',
        status: 'published',
        capacity: 10,
        address: 'Plaza Galerías, Local 12',
        city: 'Guadalajara',
        coverImageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'
      }
    ]);

    console.log('🌱 7. Poblando Calificaciones...');
    await db.insert(schoolRatings).values([
      { schoolId: school1.id, publicUserId: user1.id, rating: 5, comment: 'Excelente nivel académico, mis hijos están felices.' },
      { schoolId: school1.id, publicUserId: user2.id, rating: 4, comment: 'Muy buenos laboratorios, el estacionamiento es algo pequeño.' },
      { schoolId: school2.id, publicUserId: user1.id, rating: 5, comment: 'El mejor lugar para estudiar arte en la ciudad.' },
    ]);

    console.log('🌱 8. Poblando Suscripciones Activas...');
    await db.insert(schoolSubscriptions).values([
      {
        schoolId: school1.id,
        planId: insertedPlans.find(p => p.name === 'PREMIUM_SUBSCRIPTION')!.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        schoolId: school2.id,
        planId: insertedPlans.find(p => p.name === 'LEAD_INTEREST')!.id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('\n✨ ¡Seed completado con éxito!');
    console.log('   Usuarios: juan@gmail.com / password123');
    console.log('   Admin: director@escuela.com / password123');

  } catch (err) {
    console.error('\n❌ Error durante el seed:');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fullSeed();
