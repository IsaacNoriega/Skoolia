CREATE TABLE "course_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"public_user_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"content" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_messages_course_idx" ON "course_messages" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_messages_public_user_idx" ON "course_messages" USING btree ("public_user_id");--> statement-breakpoint
CREATE INDEX "course_messages_thread_idx" ON "course_messages" USING btree ("course_id","public_user_id","created_at");