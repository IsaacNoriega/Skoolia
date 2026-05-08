import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql, eq } from 'drizzle-orm';
import { categories, plans } from 'drizzle/schemas';

/**
 * Script para limpiar la base de datos y poblar solo datos esenciales.
 * Uso: npx ts-node -r tsconfig-paths/register src/db/clean-seed.ts
 */

async function cleanAndSeed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🗑️  1. Limpiando todas las tablas...');

  try {
    // Desactivar constraints temporalmente
    await db.execute(sql`SET session_replication_role = 'replica'`);

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
      'ratings',
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

    // Reactivar constraints
    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log('\n🌱 2. Poblando datos esenciales...');

    // ======================
    // PLANES
    // ======================
    console.log('   📦 Insertando planes...');
    await db.insert(plans).values([
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
    ]);

    // ======================
    // CATEGORÍAS
    // ======================
    console.log('   🏷️  Insertando categorías...');
    await db.insert(categories).values([
      { name: 'Bilingüe', slug: 'Languages' },
      { name: 'Tecnología', slug: 'Cpu' },
      { name: 'Deportes', slug: 'Trophy' },
      { name: 'Arte y Cultura', slug: 'Palette' },
      { name: 'Robótica', slug: 'Bot' },
      { name: 'Ciencias', slug: 'FlaskCon' },
      { name: 'Música', slug: 'Music' },
      { name: 'Religioso', slug: 'Church' },
    ]);

    console.log('\n✨ Proceso completado con éxito.');
    console.log('   La base de datos está limpia y tiene los planes y categorías base.');

  } catch (err) {
    console.error('\n❌ Error durante el proceso:');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanAndSeed();
