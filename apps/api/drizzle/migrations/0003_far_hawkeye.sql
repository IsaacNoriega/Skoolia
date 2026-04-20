ALTER TABLE "leads" ALTER COLUMN "last_trigger" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."lead_trigger";--> statement-breakpoint
CREATE TYPE "public"."lead_trigger" AS ENUM('FAVORITE', 'VIEW_MORE', 'SCHEDULE_VISIT', 'INFO_REQUEST', 'CONTACT');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "last_trigger" SET DATA TYPE "public"."lead_trigger" USING "last_trigger"::"public"."lead_trigger";