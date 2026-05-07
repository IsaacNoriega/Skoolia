import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schoolSubscriptions, schools, plans } from '../../drizzle/schemas';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/skoolia';
const client = postgres(connectionString);
const db = drizzle(client);

async function checkPlans() {
  console.log('--- Checking Active Subscriptions ---');
  
  const results = await db
    .select({
      schoolName: schools.name,
      planName: plans.name,
      planType: plans.type,
      status: schoolSubscriptions.status,
      endDate: schoolSubscriptions.endDate
    })
    .from(schoolSubscriptions)
    .innerJoin(schools, eq(schools.id, schoolSubscriptions.schoolId))
    .innerJoin(plans, eq(plans.id, schoolSubscriptions.planId))
    .where(eq(schoolSubscriptions.status, 'active'));

  if (results.length === 0) {
    console.log('No active subscriptions found.');
  } else {
    results.forEach(res => {
      console.log(`School: ${res.schoolName} | Plan: ${res.planName} (${res.planType}) | Status: ${res.status} | Ends: ${res.endDate}`);
    });
  }

  process.exit(0);
}

checkPlans().catch(err => {
  console.error(err);
  process.exit(1);
});
