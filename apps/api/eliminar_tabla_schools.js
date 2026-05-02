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
    await client.query("DROP TABLE IF EXISTS schools CASCADE;");
    console.log('Tabla schools eliminada correctamente.');
  } catch (err) {
    console.error('Error al eliminar la tabla:', err);
  } finally {
    await client.end();
  }
}

main();
