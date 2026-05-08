"use client";

import React, { useMemo } from "react";
import { useOnboarding } from "@/contexts/OnBoardingContext";

export default function Step4() {
  const { state } = useOnboarding();

  const categoriesText = useMemo(() => {
    if (!state.data.categories?.length) return "—";
    return state.data.categories.map((c) => c.name).join(", ");
  }, [state.data.categories]);

  return (
    <div className="w-full max-w-4xl space-y-10">
      {/* HEADER */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">
          Finalización
        </p>

        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-slate-950">
          Revisa tu información
        </h1>

        <p className="text-base font-medium text-slate-500 max-w-2xl">
          Asegúrate de que los detalles de tu institución sean correctos para garantizar la mejor experiencia a tus futuros alumnos.
        </p>
      </div>

      {/* CARD */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 lg:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        {state.data.tipoRegistro === "escuela" ? (
          <>
            <Section title="Institución">
              <Row label="School ID" value={state.data.schoolId ?? "—"} mono />
              <Row label="Nombre Comercial" value={state.data.schoolName || "—"} />
              <Row label="Sitio Web" value={state.data.website || "—"} />
              <Row
                label="Descripción del Perfil"
                value={state.data.description?.trim() ? state.data.description : "—"}
                multiline
              />
            </Section>
            
            <Section title="Especialidades">
              <Row label="Categorías Seleccionadas" value={categoriesText} multiline />
            </Section>

            <Section title="Información Académica">
              <Row label="Nivel Educativo" value={state.data.educationalLevel || "—"} />
              <Row label="Tipo de Institución" value={state.data.institutionType || "—"} />
              <Row label="Ubicación" value={state.data.city || "—"} />
              <Row label="Dirección Física" value={state.data.address || "—"} multiline />
            </Section>
          </>
        ) : (
          <>
            <Section title="Programa">
              <Row label="Nombre del Curso" value={state.data.cursoNombre || "—"} />
              <Row label="Descripción Detallada" value={state.data.cursoDescripcion?.trim() ? state.data.cursoDescripcion : "—"} multiline />
              <Row label="Carga Horaria" value={`${state.data.cursoDuracion} horas` || "—"} />
              <Row label="Modalidad de Impartición" value={state.data.cursoModalidad || "—"} />
            </Section>
            
            <Section title="Etiquetas">
              <Row label="Categorías Relacionadas" value={categoriesText} multiline />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
   UI helpers
========================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h3>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={`space-y-2 ${multiline ? "col-span-full" : ""}`}>
      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
        {label}
      </p>

      <div
        className={[
          "text-sm text-slate-700 leading-relaxed",
          mono ? "font-mono text-xs break-all bg-slate-50 p-3 rounded-xl border border-slate-100" : "font-bold",
          multiline ? "whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-4 custom-scrollbar" : "truncate",
        ].join(" ")}
        title={!multiline ? value : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-black/10" />;
}