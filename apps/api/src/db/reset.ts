import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

/**
 * Script para vaciar completamente la base de datos
 * Respeta el orden de foreign keys para evitar errores
 * 
 * Uso: npm run reset
 */

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🗑️  Limpiando base de datos...\n');

  try {
    // Desactivar constraints temporalmente
    await db.execute(sql`SET session_replication_role = 'replica'`);

    // Lista de tablas en orden (primero child tables, luego parents)
    const tables = [
      // Child tables (eliminar primero)
      'school_categories',
      'school_favorites',
      'school_ratings',
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
      
      // Parent tables
      'schools',
      'public_users',
      'private_users',
      'categories',
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
        console.log(`✅ Table "${table}" vacíada`);
      } catch (err) {
        console.log(`⚠️  Table "${table}" no existe o ya está vacía`);
      }
    }

    // Reactivar constraints
    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log('\n🎉 Base de datos limpiada exitosamente');
    console.log('\n💡 Próximo paso: ejecuta "npm run seed" para popular la BD');

  } catch (err) {
    console.error('❌ Error al limpiar la BD:');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
