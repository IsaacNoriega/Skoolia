const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  user: 'skoolia_user',
  password: 'skoolia_password',
  database: 'skoolia',
  port: 5432,
});

async function main() {
  try {
    await client.connect();
    // Obtener todas las tablas del esquema public
    const res = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);
    for (const row of res.rows) {
      await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
      console.log(`Tabla ${row.tablename} eliminada.`);
    }
    // Eliminar todos los tipos ENUM
    const enumRes = await client.query(`
      SELECT t.typname AS enumtype
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY enumtype;
    `);
    for (const row of enumRes.rows) {
      await client.query(`DROP TYPE IF EXISTS "${row.enumtype}" CASCADE;`);
      console.log(`Tipo ENUM ${row.enumtype} eliminado.`);
    }
    console.log('¡Todas las tablas y tipos ENUM eliminados!');
  } catch (err) {
    console.error('Error al eliminar tablas o tipos ENUM:', err);
  } finally {
    await client.end();
  }
}

main();
