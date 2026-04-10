"use client";

import { useEffect, useMemo, useState } from "react";
import { schoolsService, type School } from "../../lib/services/services/schools.service";
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

type FormState = {
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  educationalLevel: string;
  institutionType: string;
  schedule: string;
  languages: string;
  maxStudentsPerClass: string;
  enrollmentYear: string;
  enrollmentOpen: boolean;
  monthlyPrice: string;
  logoUrl: string;
  coverImageUrl: string;
};

export default function SchoolSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    educationalLevel: "",
    institutionType: "",
    schedule: "",
    languages: "",
    maxStudentsPerClass: "",
    enrollmentYear: "",
    enrollmentOpen: false,
    monthlyPrice: "",
    logoUrl: "",
    coverImageUrl: "",
  });

  // Local-only file previews (upload coming later)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : form.logoUrl || ""), [logoFile, form.logoUrl]);
  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : form.coverImageUrl || ""), [coverFile, form.coverImageUrl]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await schoolsService.getMySchool();
        if (!active) return;
        setSchool(me);
        setForm({
          name: me.name ?? "",
          description: me.description ?? "",
          address: me.address ?? "",
          city: me.city ?? "",
          latitude: me.latitude != null ? String(me.latitude) : "",
          longitude: me.longitude != null ? String(me.longitude) : "",
          educationalLevel: me.educationalLevel ?? "",
          institutionType: me.institutionType ?? "",
          schedule: me.schedule ?? "",
          languages: me.languages ?? "",
          maxStudentsPerClass: me.maxStudentsPerClass != null ? String(me.maxStudentsPerClass) : "",
          enrollmentYear: me.enrollmentYear != null ? String(me.enrollmentYear) : "",
          enrollmentOpen: !!me.enrollmentOpen,
          monthlyPrice: me.monthlyPrice != null ? String(me.monthlyPrice) : "",
          logoUrl: me.logoUrl ?? "",
          coverImageUrl: me.coverImageUrl ?? "",
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading school data");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const latitude = form.latitude ? Number(form.latitude) : undefined;
      const longitude = form.longitude ? Number(form.longitude) : undefined;
      const maxStudentsPerClass = form.maxStudentsPerClass ? Number(form.maxStudentsPerClass) : undefined;
      const enrollmentYear = form.enrollmentYear ? Number(form.enrollmentYear) : undefined;
      const monthlyPrice = form.monthlyPrice ? Number(form.monthlyPrice) : undefined;
      const logoUrl = normalizeOptionalImageUrl(form.logoUrl);
      const coverImageUrl = normalizeOptionalImageUrl(form.coverImageUrl);

      if (form.logoUrl.trim() && !logoUrl) {
        setError("La URL del logo no es válida.");
        return;
      }

      if (form.coverImageUrl.trim() && !coverImageUrl) {
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

      if (maxStudentsPerClass != null && (!Number.isInteger(maxStudentsPerClass) || maxStudentsPerClass < 1)) {
        setError("La cantidad de alumnos por clase debe ser un entero mayor o igual a 1.");
        return;
      }

      if (enrollmentYear != null && (!Number.isInteger(enrollmentYear) || enrollmentYear < 1900 || enrollmentYear > 2100)) {
        setError("El año de inscripción debe ser un entero entre 1900 y 2100.");
        return;
      }

      if (monthlyPrice != null && (!Number.isFinite(monthlyPrice) || monthlyPrice < 0)) {
        setError("El precio mensual debe ser un número mayor o igual a 0.");
        return;
      }

      const payload = {
        name: form.name || undefined,
        description: form.description || undefined,
        address: form.address || undefined,
        city: resolveMexicanState(form.city) || undefined,
        latitude,
        longitude,
        educationalLevel: form.educationalLevel || undefined,
        institutionType: form.institutionType || undefined,
        schedule: form.schedule || undefined,
        languages: form.languages || undefined,
        maxStudentsPerClass,
        enrollmentYear,
        enrollmentOpen: form.enrollmentOpen,
        monthlyPrice,
      };

      const updated = await schoolsService.update(payload);

      let latest = updated;

      if (logoFile) {
        const uploadedLogo = await filesService.upload(logoFile);
        latest = await schoolsService.updateImage("logoUrl", uploadedLogo.id);
      }

      if (coverFile) {
        const uploadedCover = await filesService.upload(coverFile);
        latest = await schoolsService.updateImage("coverImageUrl", uploadedCover.id);
      }

      setSchool(latest);
      setForm((prev) => ({
        ...prev,
        logoUrl: latest.logoUrl ?? "",
        coverImageUrl: latest.coverImageUrl ?? "",
      }));
      setSuccess("Configuración guardada");

      // Clear local file selections after save (preview only)
      setLogoFile(null);
      setCoverFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow">
        Cargando configuración…
      </div>
    );
  }

  if (error && !school) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow">
      <div className="border-b border-slate-100 pb-6">
        <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Configuración de la escuela</h1>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Actualiza datos generales, imágenes y detalles.</p>
      </div>

      {success && (
        <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Nombre y descripción */}
      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Nombre</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nombre de la escuela"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Descripción</label>
          <textarea
            className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Descripción corta"
          />
        </div>
      </div>

      {/* Imágenes */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Logo</span>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              <input
                className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                placeholder="URL del logo"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
              />
              <p className="text-xs text-slate-500">Subida desde el ordenador próximamente; por ahora usa una URL.</p>
            </div>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Imagen de portada</span>
          <div className="mt-2 flex items-center gap-4">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="Portada" className="h-16 w-28 rounded-2xl object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="h-16 w-28 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
              <input
                className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                placeholder="URL de portada"
                value={form.coverImageUrl}
                onChange={(e) => set("coverImageUrl", e.target.value)}
              />
              <p className="text-xs text-slate-500">Subida desde el ordenador próximamente; por ahora usa una URL.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Dirección</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Estado</label>
          <select
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          >
            <option value="">Selecciona un estado...</option>
            {MEXICO_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Latitud</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            type="number"
            min={-90}
            max={90}
            step="0.000001"
            value={form.latitude}
            onChange={(e) => set("latitude", e.target.value)}
            placeholder="e.g., 20.6736"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Longitud</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            type="number"
            min={-180}
            max={180}
            step="0.000001"
            value={form.longitude}
            onChange={(e) => set("longitude", e.target.value)}
            placeholder="e.g., -103.344"
          />
        </div>
      </div>

      {/* Académico */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Nivel educativo</label>
          <select
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.educationalLevel}
            onChange={(e) => set("educationalLevel", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {EDUCATIONAL_LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Tipo de institución</label>
          <select
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.institutionType}
            onChange={(e) => set("institutionType", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {INSTITUTION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Horario</label>
          <select
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.schedule}
            onChange={(e) => set("schedule", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {SCHEDULE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Idiomas</label>
          <select
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            value={form.languages}
            onChange={(e) => set("languages", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Máx. alumnos por clase</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            type="number"
            min={1}
            step={1}
            value={form.maxStudentsPerClass}
            onChange={(e) => set("maxStudentsPerClass", e.target.value)}
            placeholder="e.g., 30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Año de inscripción</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            type="number"
            min={1900}
            max={2100}
            step={1}
            value={form.enrollmentYear}
            onChange={(e) => set("enrollmentYear", e.target.value)}
            placeholder="e.g., 2026"
          />
        </div>
        <label className="mt-2 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.enrollmentOpen}
            onChange={(e) => set("enrollmentOpen", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-bold text-slate-600">Inscripciones abiertas</span>
        </label>
      </div>

      {/* Precios */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Precio mensual</label>
          <input
            className="h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            type="number"
            min={0}
            step={1}
            value={form.monthlyPrice}
            onChange={(e) => set("monthlyPrice", e.target.value)}
            placeholder="e.g., 2500"
          />
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
