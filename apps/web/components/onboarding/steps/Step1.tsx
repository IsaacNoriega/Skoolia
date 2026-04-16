"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/OnBoardingContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export default function Step1() {
  const { state, setField } = useOnboarding();

  // Nuevo: tipo de registro
  const tipo = state.data.tipoRegistro || "escuela";

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="space-y-4">
        <p className="text-lg font-light text-neutral-600">
          Configuración de la cuenta
        </p>

        <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-black">
          ¿Qué deseas registrar?
        </h1>

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            className={`px-6 py-2 rounded-full border-2 ${tipo === "escuela" ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black"}`}
            onClick={() => setField("tipoRegistro", "escuela")}
          >
            Escuela
          </button>
          <button
            type="button"
            className={`px-6 py-2 rounded-full border-2 ${tipo === "curso" ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black"}`}
            onClick={() => setField("tipoRegistro", "curso")}
          >
            Curso
          </button>
        </div>
      </div>

      {/* Campos para ESCUELA */}
      {tipo === "escuela" && (
        <>
          <div className="space-y-3">
            <Label className="text-lg font-bold">
              Nombre de la escuela
            </Label>
            <Input
              value={state.data.schoolName}
              onChange={(e) => setField("schoolName", e.target.value)}
              placeholder="Ej. Colegio Sierra Nevada"
              className="h-16 rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
            />
            {state.errors.schoolName && (
              <p className="text-sm text-red-500 px-4">
                {state.errors.schoolName}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label className="text-lg font-semibold">
              Descripción <span className="font-light text-neutral-500">(Opcional)</span>
            </Label>
            <Textarea
              value={state.data.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe tu institución, metodología, valores..."
              className="min-h-[220px] rounded-3xl bg-[#f3f3f3] border-0 text-lg px-6 py-6 resize-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
            />
          </div>
        </>
      )}

      {/* Campos para CURSO */}
      {tipo === "curso" && (
        <>
          <div className="space-y-3">
            <Label className="text-lg font-bold">
              Nombre del curso
            </Label>
            <Input
              value={state.data.cursoNombre || ""}
              onChange={(e) => setField("cursoNombre", e.target.value)}
              placeholder="Ej. Curso de Robótica"
              className="h-16 rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
            />
            {state.errors.cursoNombre && (
              <p className="text-sm text-red-500 px-4">
                {state.errors.cursoNombre}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label className="text-lg font-semibold">
              Descripción <span className="font-light text-neutral-500">(Opcional)</span>
            </Label>
            <Textarea
              value={state.data.cursoDescripcion || ""}
              onChange={(e) => setField("cursoDescripcion", e.target.value)}
              placeholder="Describe el curso, temario, requisitos..."
              className="min-h-[220px] rounded-3xl bg-[#f3f3f3] border-0 text-lg px-6 py-6 resize-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
            />
          </div>
        </>
      )}
    </div>
  );
}
