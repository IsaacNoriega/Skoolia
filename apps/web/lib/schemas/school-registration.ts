import { z } from "zod";

import { MEXICO_STATES } from "@/lib/mexico-states";

export const EDUCATIONAL_LEVEL_OPTIONS = [
  "Kinder",
  "Primaria",
  "Secundaria",
  "Preparatoria",
  "Universidad",
] as const;

export const INSTITUTION_TYPE_OPTIONS = ["Privada", "Publica"] as const;

export const LANGUAGE_OPTIONS = [
  "Espanol",
  "Ingles",
  "Espanol, Ingles",
  "Espanol, Frances",
  "Espanol, Ingles, Frances",
] as const;

export const SCHEDULE_OPTIONS = [
  "07:00 - 14:00",
  "07:30 - 14:30",
  "08:00 - 15:00",
  "08:30 - 15:30",
  "09:00 - 16:00",
] as const;

function blankStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function numberFromInput(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string") return Number(value);
  return value;
}

const optionalTextField = z.preprocess(
  blankStringToUndefined,
  z.string().max(1000).optional(),
);

const optionalIntField = (params: {
  invalidTypeError: string;
  min?: number;
  max?: number;
}) => {
  let schema = z.number({ error: params.invalidTypeError }).int(
    params.invalidTypeError,
  );

  if (typeof params.min === "number") {
    schema = schema.min(params.min, `Debe ser mayor o igual a ${params.min}.`);
  }

  if (typeof params.max === "number") {
    schema = schema.max(params.max, `Debe ser menor o igual a ${params.max}.`);
  }

  return z.preprocess(numberFromInput, schema.optional());
};

const optionalNumberField = (params: {
  invalidTypeError: string;
  min: number;
  max: number;
}) =>
  z.preprocess(
    numberFromInput,
    z
      .number({ error: params.invalidTypeError })
      .min(params.min, `Debe ser mayor o igual a ${params.min}.`)
      .max(params.max, `Debe ser menor o igual a ${params.max}.`)
      .optional(),
  );

const optionalFileSchema = z
  .custom<File | undefined>(
    (value) =>
      value === undefined ||
      value === null ||
      (typeof File !== "undefined" && value instanceof File),
    "Archivo invalido.",
  )
  .optional();

export const schoolWritableSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Ingresa el nombre de la escuela.")
      .max(160, "El nombre no puede superar los 160 caracteres."),
    description: optionalTextField,
    logoUrl: z.string().uuid("Logo invalido.").nullish(),
    coverImageUrl: z.string().uuid("Portada invalida.").nullish(),
    address: optionalTextField,
    city: z.preprocess(
      blankStringToUndefined,
      z.enum(MEXICO_STATES).optional(),
    ),
    latitude: optionalNumberField({
      invalidTypeError: "La latitud debe ser un numero valido.",
      min: -90,
      max: 90,
    }),
    longitude: optionalNumberField({
      invalidTypeError: "La longitud debe ser un numero valido.",
      min: -180,
      max: 180,
    }),
    educationalLevel: z.preprocess(
      blankStringToUndefined,
      z.enum(EDUCATIONAL_LEVEL_OPTIONS).optional(),
    ),
    institutionType: z.preprocess(
      blankStringToUndefined,
      z.enum(INSTITUTION_TYPE_OPTIONS).optional(),
    ),
    schedule: z.preprocess(
      blankStringToUndefined,
      z.enum(SCHEDULE_OPTIONS).optional(),
    ),
    maxStudentsPerClass: optionalIntField({
      invalidTypeError: "Ingresa un numero entero valido.",
      min: 1,
    }),
    languages: z.preprocess(
      blankStringToUndefined,
      z.enum(LANGUAGE_OPTIONS).optional(),
    ),
    enrollmentYear: optionalIntField({
      invalidTypeError: "Ingresa un anio valido.",
      min: 1900,
      max: 2100,
    }),
    enrollmentOpen: z.boolean().default(false),
    monthlyPrice: optionalIntField({
      invalidTypeError: "Ingresa un monto valido.",
      min: 0,
    }),
  })
  .strict();

export const schoolRegistrationWizardSchema = schoolWritableSchema
  .omit({
    logoUrl: true,
    coverImageUrl: true,
  })
  .extend({
    logoFile: optionalFileSchema,
    coverFile: optionalFileSchema,
  });

export type SchoolWritableValues = z.infer<typeof schoolWritableSchema>;
export type SchoolRegistrationWizardInput = z.input<
  typeof schoolRegistrationWizardSchema
>;
export type SchoolRegistrationWizardValues = z.infer<
  typeof schoolRegistrationWizardSchema
>;

export const SCHOOL_REGISTRATION_DEFAULT_VALUES: SchoolRegistrationWizardInput =
  {
    name: "",
    description: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    educationalLevel: "",
    institutionType: "",
    schedule: "",
    maxStudentsPerClass: "",
    languages: "",
    enrollmentYear: "",
    enrollmentOpen: false,
    monthlyPrice: "",
    logoFile: undefined,
    coverFile: undefined,
  };
