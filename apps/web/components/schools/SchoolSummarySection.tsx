"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight, Star, Users, Layers3, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SchoolsMap from "@/components/onboarding/SchoolsMap";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { messagesService, type SchoolThread } from "@/lib/services/services/messages.service";
import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";

// Helpers fuera del componente para evitar re-declaraciones
function formatRelativeDate(isoDate: string) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = date.getTime() - Date.now();
    const formatter = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
    const minutes = Math.round(diffMs / (1000 * 60));
    const hours = Math.round(diffMs / (1000 * 60 * 60));
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
    if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
    return formatter.format(days, "day");
}

export default function SchoolSummarySection() {
    const [school, setSchool] = useState<School | null>(null);
    const [threads, setThreads] = useState<SchoolThread[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const { user } = useAuth();
    const { trackLead } = useLeadTracking({ userId: user?.id || "" });

    async function handleInteraction(content: string, trigger: any) {
        console.log("[handleInteraction] Ejecutada", { userId: user?.id, schoolId: school?.id, trigger, content });
        if (!school || !user) {
            console.warn("[handleInteraction] No hay school o user", { user, school });
            return;
        }
        setActionLoading(true);
        setActionMessage(null);
        try {
            const leadResult = await trackLead({
                targetId: school.id,
                originType: "SCHOOL",
                trigger: trigger,
                status: "INTERESADO",
            });
            console.log("Respuesta de trackLead:", leadResult);
            const msgResult = await messagesService.sendParentMessage(school.id, content, user.id);
            console.log("Respuesta de sendParentMessage:", msgResult);
            // Obtener leads actuales de la escuela usando el servicio real
            try {
                const leads = await import("@/lib/services/api").then(m => m.api("/leads/school"));
                console.log("Leads actuales de la escuela (desde backend):", leads);
            } catch (err) {
                console.warn("No se pudieron obtener los leads actuales:", err);
            }
            setActionMessage("¡Acción realizada con éxito!");
        } catch (err) {
            setActionMessage("Ocurrió un error al registrar la acción.");
            console.error("Error en la interacción:", err);
        } finally {
            setActionLoading(false);
        }
    }

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                // Obtenemos la escuela y los cursos en paralelo
                const [schoolData, coursesData] = await Promise.all([
                    schoolsService.getMySchool(),
                    coursesService.listMine(),
                ]);

                if (mounted) {
                    setSchool(schoolData);
                    setCourses(coursesData);
                }

                // Obtenemos los threads usando el ID de la escuela
                if (schoolData?.id) {
                    const threadData = await messagesService.listSchoolThreads(schoolData.id);
                    if (mounted) {
                        setThreads(threadData);
                    }
                }
            } catch (err) {
                if (mounted) setError("No se pudo cargar el resumen de tu escuela.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, []);

    // Stats memorizadas
    const stats = useMemo(() => {
        const active = courses.filter(c => c.isActive && c.status !== "archived").length;
        const today = new Date().toDateString();
        const msgToday = threads.filter(t => new Date(t.lastMessageAt).toDateString() === today).length;
        const unread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
        const pending = threads.filter(t => t.threadHasUnread).length;

        return { active, msgToday, unread, pending };
    }, [courses, threads]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <section className="rounded-4xl bg-rose-50 px-5 py-5 ring-1 ring-rose-200">
                <p className="text-sm text-rose-600 font-medium">{error}</p>
            </section>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Quick Actions */}
            <header className="surface rounded-4xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                            <span className="bg-amber-100 px-3 py-1 text-amber-700 rounded-full">
                                {school?.isVerified ? "Verificada" : "Registrada"}
                            </span>
                            <span>{school?.city || "Ubicación pendiente"}</span>
                        </div>
                        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                            {school?.name ?? "Mi institución"}
                        </h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleInteraction("Información general", "INFO_REQUEST")}
                            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Enviando..." : "Solicitar información"}
                        </button>
                        <button
                            onClick={() => handleInteraction("Cita agendada", "SCHEDULE_VISIT")}
                            className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Enviando..." : "Agendar cita"}
                        </button>
                    </div>
                    {actionMessage && (
                        <div className="w-full mt-2 text-xs font-semibold text-center text-emerald-700">
                            {actionMessage}
                        </div>
                    )}
                </div>
            </header>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard 
                    label="Prospectos activos" 
                    value={threads.length} 
                    variation={stats.unread > 0 ? `${stats.unread} sin leer` : `${stats.msgToday} hoy`}
                    icon={Users}
                    color="indigo"
                />
                <StatCard 
                    label="Programas" 
                    value={stats.active} 
                    variation={`${courses.length} totales`}
                    icon={Layers3}
                    color="emerald"
                />
                <StatCard 
                    label="Rating" 
                    value={school?.averageRating.toFixed(1) || "0.0"} 
                    variation={`${school?.ratingsCount || 0} reseñas`}
                    icon={Star}
                    color="amber"
                />
            </div>

            {/* Mapa */}
            {school?.lat && school?.lng && (
                <div className="overflow-hidden rounded-4xl ring-1 ring-black/5 shadow-sm">
                    <SchoolsMap 
                        schools={[{
                            id: school.id,
                            name: school.name,
                            lat: school.lat,
                            lng: school.lng,
                            level: school.educationalLevel,
                        }]} 
                        height={320} 
                    />
                </div>
            )}
        </div>
    );
}

// Componente interno para mantener el DRY
function StatCard({ label, value, variation, icon: Icon, color }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600"
    };

    return (
        <div className="surface flex flex-col justify-between rounded-4xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <ArrowUpRight size={14} />
                {variation}
            </div>
        </div>
    );
}