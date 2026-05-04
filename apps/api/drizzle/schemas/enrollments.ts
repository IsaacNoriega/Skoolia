import { pgTable, uuid, integer, timestamp, text, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { publicUsers } from './users/public-users';
import { leads } from './leads';

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => publicUsers.id),
  targetId: uuid('target_id').notNull(),
  targetType: text('target_type', { enum: ['SCHOOL', 'COURSE'] }).notNull(),
  
  // 💰 Pricing details
  amount: integer('amount').notNull(), // Total in cents/base unit
  commission: doublePrecision('commission').notNull(), // 1% or whatever
  
  // 💳 Payment info
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  status: text('status', { enum: ['PENDING', 'COMPLETED', 'FAILED'] }).default('PENDING').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(publicUsers, {
    fields: [enrollments.userId],
    references: [publicUsers.id],
  }),
}));
