CREATE TABLE "course_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_favorites" ADD CONSTRAINT "course_favorites_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_favorites" ADD CONSTRAINT "course_favorites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_favorites_unique" ON "course_favorites" USING btree ("public_user_id","course_id");--> statement-breakpoint
CREATE INDEX "course_favorites_user_idx" ON "course_favorites" USING btree ("public_user_id");--> statement-breakpoint
CREATE INDEX "course_favorites_course_idx" ON "course_favorites" USING btree ("course_id");