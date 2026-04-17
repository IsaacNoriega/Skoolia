ALTER TABLE "courses" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
CREATE INDEX "courses_owner_idx" ON "courses" USING btree ("owner_id");