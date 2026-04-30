ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "state" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "lat" double precision;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "lng" double precision;
