"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { schoolsService, type School } from "../../lib/services/services/schools.service";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";
import { filesService } from "@/lib/services/services/files.service";
import { ArrowUpRight, Images, MapPin, ShieldCheck } from "lucide-react";

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
};

export default function SchoolSettingsForm() {
  const router = useRouter();
  const pathname = usePathname();
  const isCourseMode = pathname.startsWith("/courses");
  const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-[#1973fd]";
  const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
  const accentRingClass = isCourseMode ? "focus:ring-violet-500" : "focus:ring-indigo-500";

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
  });

  // Local-only file previews (upload coming later)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : school?.logoUrl || ""),
    [logoFile, school?.logoUrl],
  );
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : school?.coverImageUrl || ""),
    [coverFile, school?.coverImageUrl],
  );
  const completion = useMemo(() => {
    const checks = [
      form.name,
      form.description,
      form.address,
      form.city,
      form.languages,
      form.schedule,
      school?.logoUrl || logoFile,
      school?.coverImageUrl || coverFile,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [coverFile, form.address, form.city, form.description, form.languages, form.name, form.schedule, logoFile, school?.coverImageUrl, school?.logoUrl]);

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
      const latitude = form.latitude && !isNaN(Number(form.latitude)) ? Number(form.latitude) : undefined;
      const longitude = form.longitude && !isNaN(Number(form.longitude)) ? Number(form.longitude) : undefined;
      const maxStudentsPerClass = form.maxStudentsPerClass && !isNaN(Number(form.maxStudentsPerClass)) ? Number(form.maxStudentsPerClass) : undefined;
      const enrollmentYear = form.enrollmentYear && !isNaN(Number(form.enrollmentYear)) ? Number(form.enrollmentYear) : undefined;
      const monthlyPrice = form.monthlyPrice && !isNaN(Number(form.monthlyPrice)) ? Number(form.monthlyPrice) : undefined;

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

      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(galleryFiles.map(file => filesService.upload(file)));
        const galleryUrls = uploadedGallery.map(file => file.url);
        // Mezclamos con las existentes si queremos, o reemplazamos. El usuario pidió "añadir".
        const currentGallery = school?.gallery || [];
        latest = await schoolsService.update({ gallery: [...currentGallery, ...galleryUrls] });
      }

      setSchool(latest);
      setSuccess("Configuración guardada");

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
      <div className="w-full rounded-3xl bg-white p-8 shadow">
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(25,115,253,0.14),_transparent_42%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Configuración
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {isCourseMode ? "Mantén tu perfil listo para convertir" : "Ajusta la ficha pública de tu escuela"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Actualiza identidad visual, ubicación y datos clave sin salir del flujo operativo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isCourseMode && school?.id ? (
                <button
                  type="button"
                  onClick={() => router.push(`/search/institutions/${school.id}`)}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  Ver perfil público
                  <ArrowUpRight size={16} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push(isCourseMode ? "/courses/plans" : "/schools/plans")}
                className={`inline-flex h-11 items-center gap-2 rounded-2xl ${accentBgClass} px-4 text-sm font-semibold text-white transition ${accentHoverBgClass}`}
              >
                <ShieldCheck size={16} />
                Revisar plan
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoMetric label="Perfil completo" value={`${completion}%`} />
            <InfoMetric label="Galería actual" value={`${(school?.gallery?.length || 0) + galleryFiles.length}`} icon={Images} />
            <InfoMetric label="Ubicación" value={form.city || "Pendiente"} icon={MapPin} />
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} className="w-full rounded-3xl bg-white p-8">
        <div className="border-b border-slate-100 pb-6">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
            {isCourseMode ? "Configuración de perfil" : "Configuración de la escuela"}
          </h2>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {isCourseMode ? "Actualiza tus datos, imágenes y detalles de instructor." : "Actualiza datos generales, imágenes y detalles."}
          </p>
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
            className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={isCourseMode ? "Tu nombre público" : "Nombre de la escuela"}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Descripción</label>
          <textarea
            className={`w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
                className={`block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:${accentBgClass}`}
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">
                {logoFile ? `Archivo seleccionado: ${logoFile.name}` : "Selecciona un archivo para reemplazar el logo actual."}
              </p>
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
                className={`block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:${accentBgClass}`}
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">
                {coverFile ? `Archivo seleccionado: ${coverFile.name}` : "Selecciona un archivo para reemplazar la portada actual."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Galería */}
      <div className="mt-10">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Galería de fotos (Máx. 5 adicionales)</span>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Existentes */}
          {school?.gallery?.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-slate-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
              <button 
                type="button"
                onClick={async () => {
                  const nextGallery = school.gallery?.filter((_, idx) => idx !== i) || [];
                  const updated = await schoolsService.update({ gallery: nextGallery });
                  setSchool(updated);
                }}
                className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
              >
                ×
              </button>
            </div>
          ))}
          {/* Nuevas */}
          {galleryFiles.map((file, i) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-50">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover opacity-50" />
               <button 
                type="button"
                onClick={() => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-2 right-2 h-6 w-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-[10px]"
              >
                ×
              </button>
            </div>
          ))}
          {/* Botón añadir */}
          {(school?.gallery?.length || 0) + galleryFiles.length < 6 && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setGalleryFiles(prev => [...prev, ...files].slice(0, 5 - (school?.gallery?.length || 0)));
                }}
              />
              <span className="text-xl text-slate-300 font-light">+</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Añadir foto</span>
            </label>
          )}
        </div>
      </div>

      {/* Ubicación */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Dirección</label>
          <input
            className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Estado</label>
          <select
            className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
            className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
            className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
      {!isCourseMode && (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Nivel educativo</label>
            <select
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
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
              className={`h-4 w-4 rounded border-slate-300 ${isCourseMode ? "text-violet-600 focus:ring-violet-500" : "text-indigo-600 focus:ring-indigo-500"}`}
            />
            <span className="text-xs font-bold text-slate-600">Inscripciones abiertas</span>
          </label>
        </div>
      )}

      {isCourseMode && (
        <div className="mt-10 space-y-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.enrollmentOpen}
              onChange={(e) => set("enrollmentOpen", e.target.checked)}
              className={`h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500`}
            />
            <span className="text-xs font-bold text-slate-600">Perfil activo y visible</span>
          </label>
        </div>
      )}

      {!isCourseMode && (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Precio mensual</label>
            <input
              className={`h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentRingClass}`}
              type="number"
              min={0}
              step={1}
              value={form.monthlyPrice}
              onChange={(e) => set("monthlyPrice", e.target.value)}
              placeholder="e.g., 2500"
            />
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
        <div className="flex flex-wrap gap-3">
          {!isCourseMode && school?.id ? (
            <button
              type="button"
              onClick={() => router.push(`/search/institutions/${school.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Vista pública
              <ArrowUpRight size={14} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setLogoFile(null);
              setCoverFile(null);
              setGalleryFiles([]);
            }}
            className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Limpiar imágenes
          </button>
        </div>
        <button
          type="submit"
          className={`inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow ${accentHoverBgClass} disabled:opacity-60`}
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
      </form>
    </div>
  );
}

function InfoMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Images;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
