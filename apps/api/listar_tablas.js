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
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log('Tablas en la base de datos:');
    res.rows.forEach(row => console.log(row.table_name));
  } catch (err) {
    console.error('Error al listar las tablas:', err);
  } finally {
    await client.end();
  }
}

main();
