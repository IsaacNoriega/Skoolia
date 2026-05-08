"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { schoolsService, type School } from "../../lib/services/services/schools.service";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";
import { filesService } from "@/lib/services/services/files.service";
import { schoolCategoriesService, type Category } from "@/lib/services/services/schools-categories.service";
import { motion, AnimatePresence } from "framer-motion";
import StyledSelect from "@/components/ui/StyledSelect";
import { 
  ArrowUpRight, 
  Images, 
  MapPin, 
  ShieldCheck, 
  Settings, 
  Camera, 
  Map as MapIcon, 
  GraduationCap, 
  CircleUser,
  Save,
  Loader2,
  Trash2,
  Plus
} from "lucide-react";

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
  const accentColor = isCourseMode ? "violet" : "indigo";
  const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
  const accentTextClass = isCourseMode ? "text-violet-600" : "text-indigo-600";
  const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
  const accentRingClass = isCourseMode ? "focus:ring-violet-500" : "focus:ring-indigo-500";

  const [activeTab, setActiveTab] = useState<"general" | "multimedia" | "ubicacion" | "academico">("general");
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

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

        // Set initial categories
        if (me.categories) {
          setSelectedCategoryIds(me.categories.map((c: any) => c.id));
        }

        // Fetch all categories
        setCategoriesLoading(true);
        const cats = await schoolCategoriesService.getAllCategories();
        setAllCategories(cats);
        setCategoriesLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading school data");
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setLogoError(false);
  }, [logoPreview]);

  useEffect(() => {
    setCoverError(false);
  }, [coverPreview]);

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
        const currentGallery = school?.gallery || [];
        latest = await schoolsService.update({ gallery: [...currentGallery, ...galleryUrls] });
      }

      if (!isCourseMode && selectedCategoryIds.length >= 0) {
        await schoolCategoriesService.assign(selectedCategoryIds);
        // Refresh school data to get updated categories
        latest = await schoolsService.getMySchool();
      }

      setSchool(latest);
      setSuccess("Configuración guardada");
      setLogoFile(null);
      setCoverFile(null);
      setGalleryFiles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "multimedia", label: "Multimedia", icon: Camera },
    { id: "ubicacion", label: "Ubicación", icon: MapIcon },
    { id: "academico", label: "Académico", icon: GraduationCap },
    ...(!isCourseMode ? [{ id: "categorias", label: "Categorías", icon: Images }] : []),
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className={`h-12 w-12 animate-spin ${accentTextClass}`} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-24">
      {/* 🏙️ EXECUTIVE HEADER */}
      <section className="bg-slate-50/50 border border-slate-100 p-10 lg:p-14 rounded-[3rem]">
        <div className="flex flex-col xl:flex-row gap-12 items-start justify-between">
          <div className="space-y-6 flex-1">
            <div className={`text-[10px] font-black ${accentTextClass} uppercase tracking-[0.4em]`}>
              Configuración del Perfil
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
              {isCourseMode ? "Tu perfil público, <br /> tus reglas." : "Tu escuela, <br /> tu identidad."}
            </h1>
            
            <p className="text-slate-500 text-lg font-medium max-w-xl">
              Controla la identidad visual, datos operativos y presencia pública de tu institución en la plataforma.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              {!isCourseMode && school?.id && (
                <button
                  type="button"
                  onClick={() => router.push(`/search/institutions/${school.id}`)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Vista Pública <ArrowUpRight size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(isCourseMode ? "/courses/plans" : "/schools/plans")}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl ${accentBgClass} text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-${accentColor}-500/20`}
              >
                <ShieldCheck size={14} /> Mi Plan Actual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full xl:w-auto">
            <MetricCard label="Completado" value={`${completion}%`} color={completion > 80 ? "text-emerald-600" : "text-amber-600"} />
            <MetricCard label="Galería" value={`${(school?.gallery?.length || 0) + galleryFiles.length}/6`} color="text-indigo-600" />
            <div className="hidden md:block">
               <MetricCard label="Ubicación" value={form.city || "Pendiente"} color="text-slate-900" />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <nav className="w-full lg:w-72 flex lg:flex-col gap-2 p-2 bg-white border border-slate-200 rounded-[2.5rem] sticky top-8 z-30 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 px-6 py-4 rounded-3xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `${accentBgClass} text-white shadow-xl shadow-${accentColor}-500/20`
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "" : "opacity-50"} />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <form onSubmit={onSubmit} className="flex-1 w-full space-y-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                    {activeTab === "general" && "Identidad y descripción pública"}
                    {activeTab === "multimedia" && "Gestión de recursos visuales"}
                    {activeTab === "ubicacion" && "Geolocalización y dirección física"}
                    {activeTab === "academico" && "Detalles operativos y académicos"}
                    {activeTab === "categorias" && "Clasificación y etiquetas del perfil"}
                  </p>
                </div>
                {success && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                    <Save size={12} /> Configuración Guardada
                  </motion.div>
                )}
              </div>

              <div className="space-y-8">
                {activeTab === "general" && (
                  <div className="space-y-8">
                    <FormGroup label="Nombre Institucional">
                      <input
                        className={`h-14 w-full rounded-2xl bg-slate-50 px-6 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-4 focus:ring-${accentColor}-500/10 focus:border-${accentColor}-300 transition-all font-medium`}
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder={isCourseMode ? "Tu nombre público" : "Nombre de la escuela"}
                      />
                    </FormGroup>
                    <FormGroup label="Descripción General">
                      <textarea
                        className={`w-full rounded-2xl bg-slate-50 px-6 py-6 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-4 focus:ring-${accentColor}-500/10 focus:border-${accentColor}-300 transition-all font-medium resize-none`}
                        rows={6}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Describe tu institución, valores y oferta educativa..."
                      />
                    </FormGroup>
                  </div>
                )}

                {activeTab === "multimedia" && (
                  <div className="space-y-12">
                    <div className="grid gap-10 md:grid-cols-2">
                      <FormGroup label="Logotipo Oficial">
                        <div className="flex flex-col gap-6">
                           <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden ring-4 ring-slate-100 group bg-slate-50">
                            {logoPreview && !logoError ? (
                              <img 
                                src={logoPreview} 
                                alt="Logo" 
                                className="h-full w-full object-cover" 
                                onError={() => setLogoError(true)}
                              />
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                <Plus size={24} />
                                <span className="text-[8px] font-black uppercase">Subir</span>
                              </div>
                            )}
                            <label className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setLogoFile(file);
                                if (file) setLogoError(false);
                              }} />
                              <Camera className="text-white" size={24} />
                            </label>
                           </div>
                        </div>
                      </FormGroup>
                      <FormGroup label="Imagen de Portada">
                        <div className="flex flex-col gap-6">
                           <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden ring-4 ring-slate-100 group bg-slate-50">
                            {coverPreview && !coverError ? (
                              <img 
                                src={coverPreview} 
                                alt="Portada" 
                                className="h-full w-full object-cover" 
                                onError={() => setCoverError(true)}
                              />
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                <div className="h-16 w-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm">
                                  <Plus size={32} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Subir Imagen de Portada</span>
                              </div>
                            )}
                            <label className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setCoverFile(file);
                                if (file) setCoverError(false);
                              }} />
                              <Camera className="text-white" size={32} />
                            </label>
                           </div>
                        </div>
                      </FormGroup>
                    </div>

                    <FormGroup label={`Galería de Fotos (${(school?.gallery?.length || 0) + galleryFiles.length}/6)`}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {school?.gallery?.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-3xl overflow-hidden ring-1 ring-slate-100 group">
                            <img src={url} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
                            <button type="button" onClick={async () => {
                              const nextGallery = school.gallery?.filter((_, idx) => idx !== i) || [];
                              const updated = await schoolsService.update({ gallery: nextGallery });
                              setSchool(updated);
                            }} className="absolute top-2 right-2 h-8 w-8 bg-white/90 backdrop-blur-md text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"><Trash2 size={14} /></button>
                          </div>
                        ))}
                        {galleryFiles.map((file, i) => (
                          <div key={`new-${i}`} className="relative aspect-square rounded-3xl overflow-hidden ring-1 ring-slate-200 bg-slate-50">
                             <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover opacity-50" />
                             <button type="button" onClick={() => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 h-8 w-8 bg-white/90 backdrop-blur-md text-slate-400 rounded-2xl flex items-center justify-center"><Trash2 size={14} /></button>
                          </div>
                        ))}
                        {(school?.gallery?.length || 0) + galleryFiles.length < 6 && (
                          <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setGalleryFiles(prev => [...prev, ...files].slice(0, 6 - (school?.gallery?.length || 0)));
                            }} />
                            <Plus size={24} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                          </label>
                        )}
                      </div>
                    </FormGroup>
                  </div>
                )}

                {activeTab === "ubicacion" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormGroup label="Dirección Física">
                        <input className={`h-14 w-full rounded-2xl bg-slate-50 px-6 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:ring-4 focus:ring-${accentColor}-500/10 focus:border-${accentColor}-300 transition-all font-medium outline-none`} value={form.address} onChange={(e) => set("address", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Estado / Ciudad">
                        <StyledSelect
                          value={form.city}
                          onChange={(val) => set("city", val)}
                          options={MEXICO_STATES}
                          placeholder="Selecciona..."
                          showSearch
                          triggerClassName={`h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-4 focus:ring-${accentColor}-500/10 focus:border-${accentColor}-300`}
                        />
                      </FormGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormGroup label="Latitud">
                        <input className="h-14 w-full rounded-2xl bg-slate-50 px-6 text-sm outline-none ring-1 ring-slate-200 transition-all" type="number" step="0.000001" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Longitud">
                        <input className="h-14 w-full rounded-2xl bg-slate-50 px-6 text-sm outline-none ring-1 ring-slate-200 transition-all" type="number" step="0.000001" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
                      </FormGroup>
                    </div>
                  </div>
                )}

                {activeTab === "academico" && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {!isCourseMode && (
                        <>
                          <FormGroup label="Nivel Educativo">
                            <StyledSelect
                              value={form.educationalLevel}
                              onChange={(val) => set("educationalLevel", val)}
                              options={EDUCATIONAL_LEVEL_OPTIONS}
                              placeholder="Selecciona..."
                              triggerClassName={`h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white`}
                            />
                          </FormGroup>
                          <FormGroup label="Tipo de Institución">
                            <StyledSelect
                              value={form.institutionType}
                              onChange={(val) => set("institutionType", val)}
                              options={INSTITUTION_TYPE_OPTIONS}
                              placeholder="Selecciona..."
                              triggerClassName={`h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white`}
                            />
                          </FormGroup>
                        </>
                      )}
                      <FormGroup label="Horario">
                        <StyledSelect
                          value={form.schedule}
                          onChange={(val) => set("schedule", val)}
                          options={SCHEDULE_OPTIONS}
                          placeholder="Selecciona..."
                          triggerClassName={`h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white`}
                        />
                      </FormGroup>
                      <FormGroup label="Idiomas">
                        <StyledSelect
                          value={form.languages}
                          onChange={(val) => set("languages", val)}
                          options={LANGUAGE_OPTIONS}
                          placeholder="Selecciona..."
                          triggerClassName={`h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white`}
                        />
                      </FormGroup>
                      {!isCourseMode && (
                        <>
                           <FormGroup label="Precio Mensual">
                            <input className="h-14 w-full rounded-2xl bg-slate-50 px-6 text-sm outline-none ring-1 ring-slate-200 focus:bg-white transition-all" type="number" value={form.monthlyPrice} onChange={e => set("monthlyPrice", e.target.value)} />
                          </FormGroup>
                          <FormGroup label="Alumnos por Clase">
                            <input className="h-14 w-full rounded-2xl bg-slate-50 px-6 text-sm outline-none ring-1 ring-slate-200 focus:bg-white transition-all" type="number" value={form.maxStudentsPerClass} onChange={e => set("maxStudentsPerClass", e.target.value)} />
                          </FormGroup>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                       <input type="checkbox" checked={form.enrollmentOpen} onChange={(e) => set("enrollmentOpen", e.target.checked)} className={`h-5 w-5 rounded-lg border-slate-300 ${accentTextClass} focus:ring-${accentColor}-500 transition-all`} />
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{isCourseMode ? "Perfil Activo" : "Inscripciones Abiertas"}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{isCourseMode ? "Visible en la plataforma" : "Mostrar banner de admisiones"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "categorias" && (
                  <div className="space-y-10">
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Etiquetas de la Institución</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selecciona las categorías que mejor describen tu oferta educativa.</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {allCategories.map((cat) => {
                          const isSelected = selectedCategoryIds.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id));
                                } else {
                                  setSelectedCategoryIds(prev => [...prev, cat.id]);
                                }
                              }}
                              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isSelected
                                  ? `${accentBgClass} text-white shadow-lg shadow-${accentColor}-500/20`
                                  : "bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300"
                              }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 border border-indigo-100 flex gap-6 items-center">
                      <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <ShieldCheck size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Visibilidad Inteligente</p>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">
                          Las categorías ayudan a que los estudiantes encuentren tu institución más fácilmente mediante filtros avanzados de búsqueda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <button type="button" onClick={() => { setLogoFile(null); setCoverFile(null); setGalleryFiles([]); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Restablecer multimedia</button>
                 <button type="submit" disabled={saving} className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl ${accentBgClass} text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-${accentColor}-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}>
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                 </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] min-w-[140px] text-center xl:text-left">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{label}</label>
      {children}
    </div>
  );
}
