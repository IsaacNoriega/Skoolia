import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  plans,
  planNameEnum,
  planTypeEnum,
  planPricingModelEnum,
  type PlanFeatures,
} from 'drizzle/schemas';

const BASE_PLANS = [
  {
    name: 'FREEMIUM',
    type: 'subscription',
    pricingModel: 'recurrent',
    price: 0,
    isActive: 1,
    features: [
      'Registro gratuito',
      'Sin prioridad en búsquedas',
    ],
  },
  {
    name: 'PREMIUM_SUBSCRIPTION',
    type: 'subscription',
    pricingModel: 'recurrent',
    price: 2000,
    isActive: 1,
    features: [
      'Aparece al inicio de las búsquedas',
      'Destacado visualmente',
    ],
  },
  {
    name: 'LEAD_INTEREST',
    type: 'lead',
    pricingModel: 'per_event',
    price: 200,
    isActive: 1,
    features: [
      'Pago por contacto calificado',
      'Cobro cuando un padre muestra interés',
    ],
  },
  {
    name: 'LEAD_ENROLLMENT',
    type: 'lead',
    pricingModel: 'variable',
    price: 1, // Representa 1% comisión
    isActive: 1,
    features: [
      'Comisión del 1% del valor de inscripción',
      'Cobro cuando un alumno se inscribe',
    ],
  },
  {
    name: 'MASS_MESSAGE',
    type: 'lead',
    pricingModel: 'per_event',
    price: 100,
    isActive: 1,
    features: [
      'Envío de mensajes a usuarios por localidad',
      'Cobro basado en leads generados',
    ],
  },
];

async function seedPlans() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log('Eliminando planes existentes...');
    await db.delete(plans);
    await db.insert(plans).values(BASE_PLANS as any);
    console.log('Planes base insertados correctamente.');
  } finally {
    await pool.end();
  }
}

seedPlans().catch((error) => {
  console.error('Failed to seed plans');
  console.error(error);
  process.exit(1);
});
