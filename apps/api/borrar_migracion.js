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
    const res = await client.query("DELETE FROM drizzle_migrations WHERE name = '0023_even_stephen_strange.sql';");
    console.log('Migración eliminada correctamente:', res.rowCount);
  } catch (err) {
    console.error('Error al eliminar la migración:', err);
  } finally {
    await client.end();
  }
}

main();
