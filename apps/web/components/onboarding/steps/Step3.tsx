"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/contexts/OnBoardingContext";
import EducationalLevelSelect from "./EducationalLevelSelect";
import { cityOptions, institutionTypeOptions } from "./onboarding-options";

export default function Step3() {
  const { state, setField } = useOnboarding();

  return (
    <div className="w-full max-w-3xl space-y-10">
      {/* HEADER */}
      <div className="space-y-4">
        <p className="text-lg font-light text-neutral-600">
          Configuración de la cuenta
        </p>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-black">
          Nivel educativo de la escuela
        </h1>

        <p className="text-lg sm:text-xl font-light text-neutral-600 max-w-3xl">
          Este es el nombre comercial que verán tus clientes. Más adelante
          podrás añadir la razón social.
        </p>
      </div>

      {/* FORM */}
      <div className="space-y-8">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nivel educativo */}
          <div className="space-y-3">
            <EducationalLevelSelect />

            {state.errors.educationalLevel && (
              <p className="text-sm text-red-500 px-2">
                {state.errors.educationalLevel}
              </p>
            )}
          </div>

          {/* Tipo de institución */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Tipo de institución</Label>

            <select
              value={state.data.institutionType}
              onChange={(e) => setField("institutionType", e.target.value)}
              className="
                h-16
                w-full
                rounded-full
                bg-[#f3f3f3]
                border-0
                text-lg
                px-8
                focus-visible:ring-2
                focus-visible:ring-black
                focus-visible:ring-offset-0
              "
            >
              <option value="">Selecciona un tipo</option>
              {institutionTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {state.errors.institutionType && (
              <p className="text-sm text-red-500 px-2">
                {state.errors.institutionType}
              </p>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Estado</Label>

          <select
            value={state.data.city}
            onChange={(e) => setField("city", e.target.value)}
            className="
              h-16
              w-full
              rounded-full
              bg-[#f3f3f3]
              border-0
              text-lg
              px-8
              focus-visible:ring-2
              focus-visible:ring-black
              focus-visible:ring-offset-0
            "
          >
            <option value="">Selecciona un estado</option>
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {state.errors.city && (
            <p className="text-sm text-red-500 px-2">{state.errors.city}</p>
          )}
        </div>
      </div>
    </div>
  );
}
