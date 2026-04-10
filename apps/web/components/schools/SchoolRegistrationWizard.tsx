/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { schoolsService } from "@/lib/services/services/schools.service";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";
import { filesService } from "@/lib/services/services/files.service";

const EDUCATIONAL_LEVEL_OPTIONS = [
    "Kinder",
    "Primaria",
    "Secundaria",
    "Preparatoria",
    "Universidad",
] as const;

const INSTITUTION_TYPE_OPTIONS = ["Privada", "Pública"] as const;

const LANGUAGE_OPTIONS = [
    "Español",
    "Inglés",
    "Español, Inglés",
    "Español, Francés",
    "Español, Inglés, Francés",
] as const;

const SCHEDULE_OPTIONS = [
    "07:00 - 14:00",
    "07:30 - 14:30",
    "08:00 - 15:00",
    "08:30 - 15:30",
    "09:00 - 16:00",
] as const;

function normalizeOptionalImageUrl(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    try {
        return new URL(`https://${trimmed}`).toString();
    } catch {
        return undefined;
    }
}

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function SchoolRegistrationWizard({ isOpen, onClose }: Props) {
    const [step, setStep] = useState<2 | 3 | 4>(2);

    const [name, setName] = useState("");
    const [educationalLevel, setEducationalLevel] = useState("");
    const [institutionType, setInstitutionType] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [description, setDescription] = useState("");

    const [phone, setPhone] = useState("");
    const [contactEmail, setContactEmail] = useState("");

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Campos adicionales
    const [languages, setLanguages] = useState("");
    const [schedule, setSchedule] = useState("");
    const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null);
    const [logoUrl, setLogoUrl] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [maxStudentsPerClass, setMaxStudentsPerClass] = useState<number | null>(null);
    const [enrollmentYear, setEnrollmentYear] = useState<number | null>(null);
    const [enrollmentOpen, setEnrollmentOpen] = useState<boolean>(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const goNext = () => {
        setError(null);
        setStep((prev) => (prev === 2 ? 3 : 4));
    };

    const goPrev = () => {
        setError(null);
        setStep((prev) => (prev === 4 ? 3 : 2));
    };

    const handleConfirm = async () => {
        setError(null);
        setLoading(true);
        try {
            const normalizedLogoUrl = normalizeOptionalImageUrl(logoUrl);
            const normalizedCoverImageUrl = normalizeOptionalImageUrl(coverImageUrl);

            if (logoUrl.trim() && !normalizedLogoUrl) {
                setError("La URL del logo no es válida.");
                return;
            }

            if (coverImageUrl.trim() && !normalizedCoverImageUrl) {
                setError("La URL de portada no es válida.");
                return;
            }

            if (latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
                setError("La latitud debe ser un número entre -90 y 90.");
                return;
            }

            if (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
                setError("La longitud debe ser un número entre -180 y 180.");
                return;
            }

            if (monthlyPrice != null && (!Number.isFinite(monthlyPrice) || monthlyPrice < 0)) {
                setError("El precio mensual debe ser un número mayor o igual a 0.");
                return;
            }

            if (maxStudentsPerClass != null && (!Number.isInteger(maxStudentsPerClass) || maxStudentsPerClass < 1)) {
                setError("La cantidad de alumnos por clase debe ser un entero mayor o igual a 1.");
                return;
            }

            if (enrollmentYear != null && (!Number.isInteger(enrollmentYear) || enrollmentYear < 1900 || enrollmentYear > 2100)) {
                setError("El año de inscripción debe estar entre 1900 y 2100.");
                return;
            }

            // 1️⃣ Crear la escuela (nombre + descripción)
            await schoolsService.create({
                name,
                description,
            });

            // 2️⃣ Guardar información adicional usando update
            await schoolsService.update({
                address: address.trim() || undefined,
                city: resolveMexicanState(city.trim()) || undefined,
                educationalLevel: educationalLevel || undefined,
                institutionType: institutionType || undefined,
                languages: languages.trim() || undefined,
                schedule: schedule.trim() || undefined,
                monthlyPrice: monthlyPrice ?? undefined,
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
                maxStudentsPerClass: maxStudentsPerClass ?? undefined,
                enrollmentYear: enrollmentYear ?? undefined,
                enrollmentOpen: enrollmentOpen ?? undefined,
            });

            if (logoFile) {
                const uploadedLogo = await filesService.upload(logoFile);
                await schoolsService.updateImage("logoUrl", uploadedLogo.id);
            }

            if (coverFile) {
                const uploadedCover = await filesService.upload(coverFile);
                await schoolsService.updateImage("coverImageUrl", uploadedCover.id);
            }

            onClose();
        } catch (err: any) {
            console.error(err);
            if (err?.name === "ApiError" && (err.status === 401 || err.status === 403)) {
                setError("Debes iniciar sesión como escuela para registrar tu institución.");
            } else {
                setError("No se pudo registrar la institución. Inténtalo de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={handleBackdropClick}
            aria-modal
            role="dialog"
        >
            <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl">
                {/* Close */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute right-6 top-6 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <header className="border-b border-slate-100 px-8 py-5">
                    <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                        Datos de la Institución
                    </h2>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Paso {step} de 4 · Información General
                    </p>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                    Nombre del colegio
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej. Colegio Británico de México"
                                    className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Nivel educativo
                                    </label>
                                    <select
                                        value={educationalLevel}
                                        onChange={(e) => setEducationalLevel(e.target.value)}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecciona...</option>
                                        {EDUCATIONAL_LEVEL_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Tipo de institución
                                    </label>
                                    <select
                                        value={institutionType}
                                        onChange={(e) => setInstitutionType(e.target.value)}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecciona...</option>
                                        {INSTITUTION_TYPE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Dirección
                                    </label>
                                    <input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Calle y número"
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Estado
                                    </label>
                                    <select
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecciona un estado...</option>
                                        {MEXICO_STATES.map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                    Descripción del proyecto
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explica qué ofreces y por qué los padres deberían elegirte..."
                                    rows={4}
                                    className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Whatsapp / Teléfono
                                    </label>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+52 ..."
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Email de contacto
                                    </label>
                                    <input
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="contacto@tuproyecto.com"
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                    <span className="text-xl">📷</span>
                                </div>
                                <h3 className="mt-4 text-sm font-extrabold text-slate-900">
                                    Identidad Visual
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Sube el logo de tu escuela y fotos de portada.
                                </p>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 text-left">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Logo URL</label>
                                        <input
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="mt-2 block w-full text-xs text-slate-600"
                                            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Portada URL</label>
                                        <input
                                            value={coverImageUrl}
                                            onChange={(e) => setCoverImageUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="mt-2 block w-full text-xs text-slate-600"
                                            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 mt-6">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Idiomas
                                    </label>
                                    <select
                                        value={languages}
                                        onChange={(e) => setLanguages(e.target.value)}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecciona...</option>
                                        {LANGUAGE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Horario
                                    </label>
                                    <select
                                        value={schedule}
                                        onChange={(e) => setSchedule(e.target.value)}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecciona...</option>
                                        {SCHEDULE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Precio mensual
                                    </label>
                                    <input
                                        value={monthlyPrice ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setMonthlyPrice(v === "" ? null : Number(v));
                                        }}
                                        placeholder="Ej. 2500"
                                        type="number"
                                        min={0}
                                        step={1}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Máx. alumnos por clase</label>
                                    <input
                                        value={maxStudentsPerClass ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setMaxStudentsPerClass(v === "" ? null : Number(v));
                                        }}
                                        placeholder="Ej. 25"
                                        type="number"
                                        min={1}
                                        step={1}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Año de inscripción</label>
                                    <input
                                        value={enrollmentYear ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setEnrollmentYear(v === "" ? null : Number(v));
                                        }}
                                        placeholder="Ej. 2026"
                                        type="number"
                                        min={1900}
                                        max={2100}
                                        step={1}
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="enrollmentOpen"
                                        type="checkbox"
                                        checked={enrollmentOpen}
                                        onChange={(e) => setEnrollmentOpen(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="enrollmentOpen" className="text-xs font-bold text-slate-600">Inscripción abierta</label>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Latitud</label>
                                    <input
                                        value={latitude ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setLatitude(v === "" ? null : Number(v));
                                        }}
                                        placeholder="Ej. 20.6597"
                                        type="number"
                                        min={-90}
                                        max={90}
                                        step="0.000001"
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Longitud</label>
                                    <input
                                        value={longitude ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setLongitude(v === "" ? null : Number(v));
                                        }}
                                        placeholder="Ej. -103.3496"
                                        type="number"
                                        min={-180}
                                        max={180}
                                        step="0.000001"
                                        className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                    ¡Listo para despegar!
                                </h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Al registrar tu escuela, aparecerás en las búsquedas de miles de padres.
                                </p>
                            </div>

                            <div className="mt-4 w-full max-w-md rounded-3xl bg-emerald-50 px-6 py-4 text-left">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                                    Activarás estas funciones:
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-900">
                                    <li>Perfil público optimizado</li>
                                    <li>Recepción de mensajes ilimitados</li>
                                    <li>Pipeline de inscripciones</li>
                                </ul>
                            </div>

                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="flex items-center justify-between border-t border-slate-100 px-8 py-4 text-xs sm:text-sm">
                    <button
                        type="button"
                        onClick={step === 2 ? onClose : goPrev}
                        className="font-semibold text-slate-500 hover:text-slate-700"
                    >
                        Anterior
                    </button>

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={goNext}
                            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
                        >
                            Continuar
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={loading || !name}
                            onClick={handleConfirm}
                            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {loading ? "Publicando..." : "Confirmar y publicar"}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
