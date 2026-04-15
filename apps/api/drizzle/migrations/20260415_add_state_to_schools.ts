import { sql } from 'drizzle-orm';

export default {
  up: async (db) => {
    await db.run(sql`ALTER TABLE schools ADD COLUMN state text;`);
  },
  down: async (db) => {
    await db.run(sql`ALTER TABLE schools DROP COLUMN state;`);
  },
};
