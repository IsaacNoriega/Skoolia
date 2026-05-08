"use client";

import { useEffect, useState, type ReactNode } from "react";
import { geocodingService } from "@/lib/services/geocoding.service";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Upload, X } from "lucide-react";
import {
  useForm,
  type FieldPath,
} from "react-hook-form";

import { useToast } from "@/components/ui/toast";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";
import {
    SCHOOL_REGISTRATION_DEFAULT_VALUES,
    EDUCATIONAL_LEVEL_OPTIONS,
    INSTITUTION_TYPE_OPTIONS,
    LANGUAGE_OPTIONS,
    SCHEDULE_OPTIONS,
    schoolRegistrationWizardSchema,
    type SchoolRegistrationWizardInput,
    type SchoolRegistrationWizardValues,
} from "@/lib/schemas/school-registration";
import { ApiError } from "@/lib/services/api";
import { filesService } from "@/lib/services/services/files.service";
import { schoolsService } from "@/lib/services/services/schools.service";
import { cn } from "@/lib/utils";
import StyledSelect from "@/components/ui/StyledSelect";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

type PendingAction = "next" | "submit" | null;
type FormErrorLike = { message?: string } | undefined;

const STEP_FIELDS: Array<FieldPath<SchoolRegistrationWizardInput>[]> = [
    ["name", "description", "address", "city"],
    [
        "educationalLevel",
        "institutionType",
        "languages",
        "schedule",
        "monthlyPrice",
        "maxStudentsPerClass",
        "enrollmentYear",
        "enrollmentOpen",
    ],
    ["latitude", "longitude", "logoFile", "coverFile"],
];

const STEP_META = [
    {
        title: "Datos generales",
        description:
            "Presenta tu institucion con la informacion base que se guardara en el perfil.",
    },
    {
        title: "Datos academicos",
        description:
            "Completa la oferta educativa, modalidad y datos clave de inscripcion.",
    },
    {
        title: "Ubicacion y medios",
        description:
            "Agrega coordenadas opcionales y sube los archivos visuales que se asociaran al perfil.",
    },
    {
        title: "Revision final",
        description:
            "Confirma los datos antes de crear o completar el perfil de la escuela.",
    },
] as const;

function getApiErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
            return "Debes iniciar sesion con una cuenta de escuela para completar este registro.";
        }

        const payload = error.data;

        if (typeof payload === "string" && payload.trim()) {
            return payload;
        }

        if (
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
        ) {
            return payload.message;
        }

        if (
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            Array.isArray(payload.message)
        ) {
            return payload.message.join(" ");
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "No pudimos guardar la escuela. Intentalo otra vez.";
}

function inputClassName(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:bg-white",
    hasError
      ? "border-rose-300 ring-2 ring-rose-100 focus:border-rose-400 focus:ring-rose-200"
      : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
  );
}

function textareaClassName(hasError: boolean) {
  return cn(
    "w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:bg-white",
    hasError
      ? "border-rose-300 ring-2 ring-rose-100 focus:border-rose-400 focus:ring-rose-200"
      : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
  );
}

function FieldShell({
    label,
    error,
    children,
}: {
  label: string;
  error?: FormErrorLike;
  children: ReactNode;
}) {
    return (
        <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {label}
            </label>
            {children}
            {error ? (
                <p className="mt-2 text-xs font-medium text-rose-600">{error.message}</p>
            ) : null}
        </div>
    );
}

function FilePicker({
    id,
    label,
    hint,
    filename,
    error,
    onChange,
}: {
  id: string;
  label: string;
  hint: string;
  filename?: string;
  error?: FormErrorLike;
  onChange: (file?: File) => void;
}) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                    <Upload size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs text-slate-500">{hint}</p>
                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        className="mt-4 block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white"
                        onChange={(event) => onChange(event.target.files?.[0])}
                    />
                    {filename ? (
                        <p className="mt-2 truncate text-xs font-medium text-emerald-700">
                            Archivo seleccionado: {filename}
                        </p>
                    ) : null}
                    {error ? (
                        <p className="mt-2 text-xs font-medium text-rose-600">{error.message}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function SchoolRegistrationWizard({ isOpen, onClose }: Props) {
    const router = useRouter();
    const { showToast } = useToast();
    const [step, setStep] = useState(0);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    const {
        register,
        handleSubmit,
        reset,
        trigger,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<
        SchoolRegistrationWizardInput,
        unknown,
        SchoolRegistrationWizardValues
    >({
        resolver: zodResolver(schoolRegistrationWizardSchema),
        mode: "onBlur",
        shouldUnregister: false,
        defaultValues: SCHOOL_REGISTRATION_DEFAULT_VALUES,
    });

  const logoFile = watch("logoFile") as File | undefined;
  const coverFile = watch("coverFile") as File | undefined;
  const schoolName = watch("name") as string | undefined;
  const schoolCity = watch("city") as string | undefined;
  const educationalLevel = watch("educationalLevel") as string | undefined;
  const institutionType = watch("institutionType") as string | undefined;
  const schedule = watch("schedule") as string | undefined;
  const monthlyPrice = watch("monthlyPrice") as number | undefined;
  const currentStepMeta = STEP_META[step];

    useEffect(() => {
        if (!isOpen) {
            setStep(0);
            setPendingAction(null);
            reset(SCHOOL_REGISTRATION_DEFAULT_VALUES);
        }
    }, [isOpen, reset]);

    if (!isOpen) return null;

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    const goPrev = () => {
        if (step === 0) {
            onClose();
            return;
        }

        setStep((current) => Math.max(current - 1, 0));
    };


    const goNext = async () => {
        setPendingAction("next");
        const isValid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
        if (!isValid) {
            setPendingAction(null);
            return;
        }

        // Si estamos en el paso 0, geocodificar antes de avanzar
        if (step === 0) {
            const addressRaw = watch("address");
            const cityRaw = watch("city");
            const address = typeof addressRaw === 'string' ? addressRaw : '';
            const city = typeof cityRaw === 'string' ? cityRaw : '';
            if (address && city) {
                showToast({
                    title: "Buscando coordenadas...",
                    description: "Geocodificando la dirección ingresada.",
                    variant: "info",
                    duration: 2500,
                });
                const geo = await geocodingService.geocodeAddressWithFallback(address, city);
                if (geo.success && geo.data) {
                    setValue("latitude", geo.data.lat, { shouldValidate: true });
                    setValue("longitude", geo.data.lng, { shouldValidate: true });
                    showToast({
                        title: geo.data.type === 'exact' ? "Coordenadas encontradas" : "Ubicación aproximada",
                        description: geo.data.type === 'exact' 
                          ? `Latitud: ${geo.data.lat.toFixed(6)}, Longitud: ${geo.data.lng.toFixed(6)}`
                          : "No encontramos la calle exacta, usamos tu ciudad. Puedes ajustar el mapa después.",
                        variant: geo.data.type === 'exact' ? "success" : "warning",
                    });
                } else {
                    showToast({
                        title: "No se pudo geocodificar la dirección",
                        description: geo.error || "Verifica que la dirección y el estado sean correctos. Puedes ingresar las coordenadas manualmente en el siguiente paso.",
                        variant: "error",
                    });
                }
            }
        }
        setPendingAction(null);
        setStep((current) => Math.min(current + 1, STEP_META.length - 1));
    };

  const onSubmit = handleSubmit(async (values: SchoolRegistrationWizardValues) => {
        setPendingAction("submit");

        try {
            let reusedExistingSchool = false;

            try {
                await schoolsService.create({
                    name: values.name,
                    description: values.description,
                });
            } catch (error) {
                if (error instanceof ApiError && error.status === 409) {
                    reusedExistingSchool = true;
                } else {
                    throw error;
                }
            }

            await schoolsService.update({
                name: values.name,
                description: values.description,
                address: values.address,
                city: resolveMexicanState(values.city),
                latitude: values.latitude,
                longitude: values.longitude,
                educationalLevel: values.educationalLevel,
                institutionType: values.institutionType,
                schedule: values.schedule,
                languages: values.languages,
                maxStudentsPerClass: values.maxStudentsPerClass,
                enrollmentYear: values.enrollmentYear,
                enrollmentOpen: values.enrollmentOpen,
                monthlyPrice: values.monthlyPrice,
            });

            if (values.logoFile) {
                const uploadedLogo = await filesService.upload(values.logoFile);
                await schoolsService.updateImage("logoUrl", uploadedLogo.id);
            }

            if (values.coverFile) {
                const uploadedCover = await filesService.upload(values.coverFile);
                await schoolsService.updateImage("coverImageUrl", uploadedCover.id);
            }

            showToast({
                title: reusedExistingSchool
                    ? "Perfil de escuela actualizado"
                    : "Escuela registrada con exito",
                description: reusedExistingSchool
                    ? "Detectamos una escuela previa y terminamos de completar su configuracion."
                    : "Tu institucion ya puede continuar al dashboard.",
                variant: "success",
            });

            reset(SCHOOL_REGISTRATION_DEFAULT_VALUES);
            setStep(0);
            onClose();
            router.push("/schools");
            router.refresh();
        } catch (error) {
            showToast({
                title: "No pudimos guardar la escuela",
                description: getApiErrorMessage(error),
                variant: "error",
            });
        } finally {
            setPendingAction(null);
        }
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
            onClick={handleBackdropClick}
            aria-modal
            role="dialog"
        >
            <form
                onSubmit={onSubmit}
                className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    disabled={isSubmitting}
                    className="absolute right-6 top-6 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <header className="border-b border-slate-100 px-8 py-5">
                    <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                        Registro de escuela
                    </h2>
                    <div className="mt-1 flex items-center justify-between gap-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Paso {step + 1} de {STEP_META.length} � {currentStepMeta.title}
                        </p>
                        <div className="flex flex-1 justify-end gap-2">
                            {STEP_META.map((item, index) => (
                                <span
                                    key={item.title}
                                    className={cn(
                                        "h-2 w-16 rounded-full",
                                        index <= step ? "bg-slate-900" : "bg-slate-200",
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm text-slate-500">
                        {currentStepMeta.description}
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {step === 0 ? (
                        <div className="space-y-6">
                            <FieldShell label="Nombre del colegio" error={errors.name}>
                                <input
                  {...register("name")}
                  placeholder="Ej. Colegio Britanico de Mexico"
                  className={inputClassName(Boolean(errors.name))}
                />
              </FieldShell>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldShell label="Direccion" error={errors.address}>
                                    <input
                    {...register("address")}
                    placeholder="Calle y numero"
                    className={inputClassName(Boolean(errors.address))}
                  />
                </FieldShell>

                <FieldShell label="Estado" error={errors.city}>
                  <StyledSelect
                    value={schoolCity || ""}
                    onChange={(val) => setValue("city", val, { shouldValidate: true })}
                    options={MEXICO_STATES}
                    placeholder="Selecciona un estado..."
                    showSearch
                    triggerClassName={inputClassName(Boolean(errors.city))}
                  />
                </FieldShell>
                            </div>

                            <FieldShell
                                label="Descripcion del proyecto"
                                error={errors.description}
                            >
                                <textarea
                                    {...register("description")}
                  rows={5}
                  placeholder="Explica que ofrece tu institucion y por que deberian elegirla."
                  className={textareaClassName(Boolean(errors.description))}
                />
              </FieldShell>
                        </div>
                    ) : null}

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldShell
                                    label="Nivel educativo"
                                    error={errors.educationalLevel}
                                >
                                    <StyledSelect
                                      value={educationalLevel || ""}
                                      onChange={(val) => setValue("educationalLevel", val, { shouldValidate: true })}
                                      options={EDUCATIONAL_LEVEL_OPTIONS}
                                      placeholder="Selecciona..."
                                      triggerClassName={inputClassName(Boolean(errors.educationalLevel))}
                                    />
                                </FieldShell>

                                <FieldShell
                                    label="Tipo de institucion"
                                    error={errors.institutionType}
                                >
                                    <StyledSelect
                                      value={institutionType || ""}
                                      onChange={(val) => setValue("institutionType", val, { shouldValidate: true })}
                                      options={INSTITUTION_TYPE_OPTIONS}
                                      placeholder="Selecciona..."
                                      triggerClassName={inputClassName(Boolean(errors.institutionType))}
                                    />
                                </FieldShell>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldShell label="Idiomas" error={errors.languages}>
                                    <StyledSelect
                                      value={watch("languages") || ""}
                                      onChange={(val) => setValue("languages", val, { shouldValidate: true })}
                                      options={LANGUAGE_OPTIONS}
                                      placeholder="Selecciona..."
                                      triggerClassName={inputClassName(Boolean(errors.languages))}
                                    />
                                </FieldShell>

                                <FieldShell label="Horario" error={errors.schedule}>
                                    <StyledSelect
                                      value={schedule || ""}
                                      onChange={(val) => setValue("schedule", val, { shouldValidate: true })}
                                      options={SCHEDULE_OPTIONS}
                                      placeholder="Selecciona..."
                                      triggerClassName={inputClassName(Boolean(errors.schedule))}
                                    />
                                </FieldShell>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldShell label="Precio mensual" error={errors.monthlyPrice}>
                                    <input
                                        {...register("monthlyPrice")}
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Ej. 2500"
                    className={inputClassName(Boolean(errors.monthlyPrice))}
                  />
                                </FieldShell>

                                <FieldShell
                                    label="Max. alumnos por clase"
                                    error={errors.maxStudentsPerClass}
                                >
                                    <input
                                        {...register("maxStudentsPerClass")}
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Ej. 25"
                    className={inputClassName(Boolean(errors.maxStudentsPerClass))}
                  />
                                </FieldShell>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldShell
                                    label="Anio de inscripcion"
                                    error={errors.enrollmentYear}
                                >
                                    <input
                                        {...register("enrollmentYear")}
                    type="number"
                    min={1900}
                    max={2100}
                    step={1}
                    placeholder="Ej. 2026"
                    className={inputClassName(Boolean(errors.enrollmentYear))}
                  />
                                </FieldShell>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <label className="flex items-center justify-between gap-3">
                                        <span>
                                            <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                                Inscripcion abierta
                                            </span>
                                            <span className="mt-1 block text-sm text-slate-600">
                                                Marca esta opcion si estas recibiendo solicitudes.
                                            </span>
                                        </span>
                                        <input
                                            {...register("enrollmentOpen")}
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {step === 2 ? (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldShell label="Latitud" error={errors.latitude}>
                                    <input
                                        {...register("latitude")}
                    type="number"
                    min={-90}
                    max={90}
                    step="0.000001"
                    placeholder="Ej. 20.6597"
                    className={inputClassName(Boolean(errors.latitude))}
                  />
                                </FieldShell>

                                <FieldShell label="Longitud" error={errors.longitude}>
                                    <input
                                        {...register("longitude")}
                    type="number"
                    min={-180}
                    max={180}
                    step="0.000001"
                    placeholder="Ej. -103.3496"
                    className={inputClassName(Boolean(errors.longitude))}
                  />
                                </FieldShell>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FilePicker
                                    id="logoFile"
                                    label="Logo institucional"
                                    hint="Se subira al backend y se asociara como imagen principal del perfil."
                                    filename={logoFile?.name}
                                    error={errors.logoFile}
                                    onChange={(file) =>
                                        setValue("logoFile", file, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                />
                                <FilePicker
                                    id="coverFile"
                                    label="Imagen de portada"
                                    hint="Usa una imagen horizontal para que luzca mejor en el dashboard y el perfil publico."
                                    filename={coverFile?.name}
                                    error={errors.coverFile}
                                    onChange={(file) =>
                                        setValue("coverFile", file, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <ShieldCheck size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                    Listo para publicar
                                </h3>
                                <p className="mt-2 max-w-xl text-sm text-slate-600">
                                    Revisamos el formulario y esta listo para crear la escuela y
                                    sincronizar la informacion complementaria con el backend.
                                </p>
                            </div>

                            <div className="grid w-full max-w-2xl gap-4 rounded-3xl bg-slate-50 p-6 text-left sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Escuela
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                    {schoolName || "Sin nombre"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {schoolCity || "Estado sin definir"}
                  </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Oferta academica
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                    {educationalLevel || "Nivel pendiente"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {institutionType || "Tipo pendiente"}
                  </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Operacion
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                    {schedule || "Horario pendiente"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {monthlyPrice
                      ? `$${monthlyPrice} MXN / mes`
                      : "Precio sin definir"}
                  </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Archivos
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {logoFile ? "Logo listo" : "Sin logo"}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {coverFile ? "Portada lista" : "Sin portada"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <footer className="flex items-center justify-between border-t border-slate-100 px-8 py-4 text-xs sm:text-sm">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={isSubmitting}
                        className="font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
                    >
                        {step === 0 ? "Cancelar" : "Anterior"}
                    </button>

                    {step < STEP_META.length - 1 ? (
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={pendingAction !== null}
                            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {pendingAction === "next" ? "Validando..." : "Siguiente"}
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {pendingAction === "submit" ? "Finalizando..." : "Finalizar"}
                        </button>
                    )}
                </footer>
            </form>
        </div>
    );
}
