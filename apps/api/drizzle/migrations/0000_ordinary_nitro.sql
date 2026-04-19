CREATE TYPE "public"."plan_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."file_owner_type" AS ENUM('school', 'course', 'student', 'user');--> statement-breakpoint
CREATE TYPE "public"."lead_origin_type" AS ENUM('SCHOOL', 'COURSE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NUEVO', 'INTERESADO', 'VISITA', 'INSCRITO');--> statement-breakpoint
CREATE TYPE "public"."lead_trigger" AS ENUM('WEB', 'WHATSAPP', 'CALL', 'EMAIL', 'MANUAL');--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" uuid,
	"cover_image_url" uuid,
	"address" text,
	"city" text,
	"state" text,
	"latitude" double precision,
	"longitude" double precision,
	"lat" double precision,
	"lng" double precision,
	"educational_level" text,
	"institution_type" text,
	"schedule" text,
	"max_students_per_class" integer,
	"languages" text,
	"enrollment_year" integer,
	"enrollment_open" boolean DEFAULT false,
	"monthly_price" integer,
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"ratings_count" integer DEFAULT 0 NOT NULL,
	"favorites_count" integer DEFAULT 0 NOT NULL,
	"ranking_score" double precision DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"interval" "plan_interval" NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"public_user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "private_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "public_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"avatarUrl" uuid,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid,
	"owner_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"cover_image_url" uuid,
	"price" integer,
	"capacity" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"modality" text,
	"address" text,
	"city" text,
	"state" text,
	"latitude" double precision,
	"longitude" double precision,
	"average_rating" double precision DEFAULT 0 NOT NULL,
	"enrollments_count" integer DEFAULT 0 NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"monthly_budget" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"owner_id" uuid NOT NULL,
	"owner_type" "file_owner_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"public_user_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"content" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"origin_type" "lead_origin_type" NOT NULL,
	"status" "lead_status" NOT NULL,
	"last_trigger" "lead_trigger" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_logo_url_files_id_fk" FOREIGN KEY ("logo_url") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_cover_image_url_files_id_fk" FOREIGN KEY ("cover_image_url") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_owner_id_private_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."private_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_favorites" ADD CONSTRAINT "school_favorites_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_favorites" ADD CONSTRAINT "school_favorites_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_categories" ADD CONSTRAINT "school_categories_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_categories" ADD CONSTRAINT "school_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_ratings" ADD CONSTRAINT "school_ratings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_ratings" ADD CONSTRAINT "school_ratings_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_users" ADD CONSTRAINT "public_users_avatarUrl_files_id_fk" FOREIGN KEY ("avatarUrl") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_cover_image_url_files_id_fk" FOREIGN KEY ("cover_image_url") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_interests" ADD CONSTRAINT "student_interests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_interests" ADD CONSTRAINT "student_interests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_messages" ADD CONSTRAINT "school_messages_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_messages" ADD CONSTRAINT "school_messages_public_user_id_public_users_id_fk" FOREIGN KEY ("public_user_id") REFERENCES "public"."public_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_user_role_unique" ON "refresh_tokens" USING btree ("user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_owner_unique" ON "schools" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "schools_owner_idx" ON "schools" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "schools_name_idx" ON "schools" USING btree ("name");--> statement-breakpoint
CREATE INDEX "schools_city_idx" ON "schools" USING btree ("city");--> statement-breakpoint
CREATE INDEX "schools_rating_idx" ON "schools" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "schools_verified_idx" ON "schools" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "plans_name_idx" ON "plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX "plans_interval_idx" ON "plans" USING btree ("interval");--> statement-breakpoint
CREATE UNIQUE INDEX "school_subscriptions_school_unique" ON "school_subscriptions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_subscriptions_school_idx" ON "school_subscriptions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_subscriptions_plan_idx" ON "school_subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "school_subscriptions_status_idx" ON "school_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "school_favorites_unique" ON "school_favorites" USING btree ("public_user_id","school_id");--> statement-breakpoint
CREATE INDEX "school_favorites_user_idx" ON "school_favorites" USING btree ("public_user_id");--> statement-breakpoint
CREATE INDEX "school_favorites_school_idx" ON "school_favorites" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "school_categories_unique" ON "school_categories" USING btree ("school_id","category_id");--> statement-breakpoint
CREATE INDEX "school_categories_school_idx" ON "school_categories" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_categories_category_idx" ON "school_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_rating_unique" ON "school_ratings" USING btree ("school_id","public_user_id");--> statement-breakpoint
CREATE INDEX "school_ratings_school_idx" ON "school_ratings" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "private_users_email_idx" ON "private_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "private_users_active_idx" ON "private_users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "public_users_email_idx" ON "public_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "courses_school_idx" ON "courses" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "courses_owner_idx" ON "courses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_active_idx" ON "courses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "courses_rating_idx" ON "courses" USING btree ("average_rating");--> statement-breakpoint
CREATE UNIQUE INDEX "students_public_user_unique" ON "students" USING btree ("public_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_interests_unique" ON "student_interests" USING btree ("student_id","category_id");--> statement-breakpoint
CREATE INDEX "student_interests_student_idx" ON "student_interests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_interests_category_idx" ON "student_interests" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "files_owner_idx" ON "files" USING btree ("owner_id","owner_type");--> statement-breakpoint
CREATE INDEX "files_key_idx" ON "files" USING btree ("key");--> statement-breakpoint
CREATE INDEX "school_messages_school_idx" ON "school_messages" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_messages_public_user_idx" ON "school_messages" USING btree ("public_user_id");--> statement-breakpoint
CREATE INDEX "school_messages_thread_idx" ON "school_messages" USING btree ("school_id","public_user_id","created_at");