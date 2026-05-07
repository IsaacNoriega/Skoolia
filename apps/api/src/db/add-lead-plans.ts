import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { plans } from '../../drizzle/schemas/schools/plans';

const LEAD_PLANS = [
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
    price: 1, // 1%
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

async function addPlans() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log('Insertando planes de leads...');
    for (const planData of LEAD_PLANS) {
        await db.insert(plans).values(planData as any).onConflictDoNothing();
    }
    console.log('Planes de leads procesados.');
  } catch (error) {
    console.error('Error al insertar planes:', error);
  } finally {
    await pool.end();
  }
}

addPlans();
