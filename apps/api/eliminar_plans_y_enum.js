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
    await client.query("DROP TABLE IF EXISTS plans CASCADE;");
    await client.query("DROP TYPE IF EXISTS plan_interval;");
    console.log('Tabla plans y tipo ENUM plan_interval eliminados correctamente.');
  } catch (err) {
    console.error('Error al eliminar la tabla o el tipo ENUM:', err);
  } finally {
    await client.end();
  }
}

main();
