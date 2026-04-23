-- MIGRACIÓN: Tabla de suscripciones para cursos
CREATE TYPE "public"."course_subscription_status" AS ENUM('active', 'past_due', 'canceled');

CREATE TABLE "course_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "course_subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "course_subscriptions" ADD CONSTRAINT "course_subscriptions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_subscriptions" ADD CONSTRAINT "course_subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;

CREATE UNIQUE INDEX "course_subscriptions_course_unique" ON "course_subscriptions" USING btree ("course_id");
CREATE INDEX "course_subscriptions_course_idx" ON "course_subscriptions" USING btree ("course_id");
CREATE INDEX "course_subscriptions_plan_idx" ON "course_subscriptions" USING btree ("plan_id");
CREATE INDEX "course_subscriptions_status_idx" ON "course_subscriptions" USING btree ("status");
