export const COURSE_MODALITIES = [
  "Presencial",
  "En línea",
  "Híbrido",
] as const;

export type CourseModality = (typeof COURSE_MODALITIES)[number];
