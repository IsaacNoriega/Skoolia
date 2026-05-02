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
    await client.query("DROP TYPE IF EXISTS plan_interval;");
    console.log('Tipo ENUM plan_interval eliminado correctamente.');
  } catch (err) {
    console.error('Error al eliminar el tipo ENUM:', err);
  } finally {
    await client.end();
  }
}

main();
