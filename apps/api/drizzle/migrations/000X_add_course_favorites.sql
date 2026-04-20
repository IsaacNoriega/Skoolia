-- Migration: Crear tabla course_favorites
CREATE TABLE course_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_user_id UUID NOT NULL REFERENCES public_users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT course_favorites_unique UNIQUE (public_user_id, course_id)
);

CREATE INDEX course_favorites_user_idx ON course_favorites(public_user_id);
CREATE INDEX course_favorites_course_idx ON course_favorites(course_id);
