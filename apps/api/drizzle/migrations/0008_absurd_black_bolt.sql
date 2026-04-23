CREATE TYPE "public"."plan_name" AS ENUM('FREEMIUM', 'PREMIUM_SUBSCRIPTION', 'LEAD_INTEREST', 'LEAD_ENROLLMENT', 'MASS_MESSAGE');--> statement-breakpoint
CREATE TYPE "public"."plan_pricing_model" AS ENUM('recurrent', 'variable', 'per_event');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('subscription', 'lead');--> statement-breakpoint
CREATE TYPE "public"."lead_event_type" AS ENUM('interest', 'enrollment', 'mass_message');--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "lead_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "school_subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'pending');--> statement-breakpoint
ALTER TABLE "school_subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "school_subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";--> statement-breakpoint
DROP INDEX "plans_interval_idx";--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "name" SET DATA TYPE "public"."plan_name" USING "name"::"public"."plan_name";--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "type" "plan_type" DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "pricing_model" "plan_pricing_model" DEFAULT 'recurrent' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "is_active" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD COLUMN "start_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD COLUMN "end_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_events_school_idx" ON "lead_events" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lead_events_user_idx" ON "lead_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lead_events_type_idx" ON "lead_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "plans_type_idx" ON "plans" USING btree ("type");--> statement-breakpoint
CREATE INDEX "plans_pricing_model_idx" ON "plans" USING btree ("pricing_model");--> statement-breakpoint
CREATE INDEX "plans_is_active_idx" ON "plans" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "interval";--> statement-breakpoint
ALTER TABLE "school_subscriptions" DROP COLUMN "current_period_start";--> statement-breakpoint
ALTER TABLE "school_subscriptions" DROP COLUMN "current_period_end";--> statement-breakpoint
DROP TYPE "public"."plan_interval";