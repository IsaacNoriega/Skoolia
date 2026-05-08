"use client";

import React from "react";
import { useOnboarding } from "@/contexts/OnBoardingContext";
import { GraduationCap } from "lucide-react";
import OnboardingSelect from "./OnboardingSelect";

const educationalLevels = [
  "Maternal",
  "Preescolar",
  "Primaria",
  "Secundaria",
  "Preparatoria",
  "Universidad",
];

export default function EducationalLevelSelect() {
  const { state, setField } = useOnboarding();

  return (
    <OnboardingSelect
      label="Nivel educativo"
      placeholder="Selecciona un nivel"
      options={educationalLevels}
      value={state.data.educationalLevel || ""}
      onChange={(val) => setField("educationalLevel", val)}
      icon={GraduationCap}
      error={state.errors.educationalLevel}
    />
  );
}
