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
        <p className="text-lg font-light text-neutral-600">
          Configuración de la cuenta
        </p>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-black">
          Revisa tu información
        </h1>

        <p className="text-lg sm:text-xl font-light text-neutral-600 max-w-3xl">
          Confirma que todo esté correcto antes de finalizar.
        </p>
      </div>

      {/* CARD */}
      <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm space-y-8">
        {state.data.tipoRegistro === "escuela" ? (
          <>
            <Section title="Escuela">
              <Row label="School ID" value={state.data.schoolId ?? "—"} mono />
              <Row label="Nombre" value={state.data.schoolName || "—"} />
              <Row label="Sitio web" value={state.data.website || "—"} />
              <Row
                label="Descripción"
                value={state.data.description?.trim() ? state.data.description : "—"}
                multiline
              />
            </Section>
            <Divider />
            <Section title="Categorías">
              <Row label="Seleccionadas" value={categoriesText} multiline />
            </Section>
            <Divider />
            <Section title="Información académica">
              <Row label="Nivel educativo" value={state.data.educationalLevel || "—"} />
              <Row label="Tipo de institución" value={state.data.institutionType || "—"} />
              <Row label="Ciudad" value={state.data.city || "—"} />
              <Row label="Dirección" value={state.data.address || "—"} multiline />
            </Section>
          </>
        ) : (
          <>
            <Section title="Curso">
              <Row label="Nombre" value={state.data.cursoNombre || "—"} />
              <Row label="Descripción" value={state.data.cursoDescripcion?.trim() ? state.data.cursoDescripcion : "—"} multiline />
              <Row label="Duración (horas)" value={state.data.cursoDuracion || "—"} />
              <Row label="Modalidad" value={state.data.cursoModalidad || "—"} />
            </Section>
            <Divider />
            <Section title="Categorías">
              <Row label="Seleccionadas" value={categoriesText} multiline />
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
    <div className="space-y-4">
      <h3 className="text-lg font-extrabold text-black">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
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
    <div className="space-y-1">
      <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
        {label}
      </p>

      <p
        className={[
          "text-base text-black",
          mono ? "font-mono text-sm break-all" : "font-semibold",
          multiline ? "whitespace-pre-wrap" : "truncate",
        ].join(" ")}
        title={!multiline ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-black/10" />;
}