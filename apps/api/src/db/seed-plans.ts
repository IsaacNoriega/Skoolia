import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  plans,
  type PlanFeatures,
  type planIntervalEnum,
} from 'drizzle/schemas';

type PlanInterval = (typeof planIntervalEnum.enumValues)[number];

type SeedPlan = {
  name: string;
  price: number;
  interval: PlanInterval;
  features: PlanFeatures;
};

const BASE_PLANS: SeedPlan[] = [
  {
    name: 'Freemium',
    price: 0,
    interval: 'monthly',
    features: [
      'Registro gratuito',
      'Aparicion en directorio',
      'Gestion de perfil basico',
    ],
  },
  {
    name: 'Premium',
    price: 1500,
    interval: 'monthly',
    features: [
      'Aparicion en busquedas premium',
      'Panel avanzado de leads',
      'Soporte prioritario',
    ],
  },
];

async function seedPlans() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log('Seeding base plans...');

    const existingPlans = await db
      .select({ name: plans.name })
      .from(plans)
      .where(inArray(plans.name, BASE_PLANS.map((plan) => plan.name)));

    const existingPlanNames = new Set(existingPlans.map((plan) => plan.name));

    const missingPlans = BASE_PLANS.filter(
      (plan) => !existingPlanNames.has(plan.name),
    );

    if (missingPlans.length === 0) {
      console.log('Base plans already exist. Nothing to insert.');
      return;
    }

    await db.insert(plans).values(
      missingPlans.map((plan) => ({
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
      })),
    );

    console.log(`Inserted ${missingPlans.length} base plan(s).`);
  } finally {
    await pool.end();
  }
}

seedPlans().catch((error) => {
  console.error('Failed to seed plans');
  console.error(error);
  process.exit(1);
});
