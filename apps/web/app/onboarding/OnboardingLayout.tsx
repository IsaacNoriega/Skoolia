"use client";

import { useState } from "react";
import { useOnboarding } from "../../contexts/OnBoardingContext";
import Step1 from "@/components/onboarding/steps/Step1";
import Step2 from "@/components/onboarding/steps/Step2";
import Step3 from "@/components/onboarding/steps/Step3";
import { schoolsService } from "@/lib/services/services/schools.service";
import { schoolCategoriesService } from "@/lib/services/services/schools-categories.service";
import Step4 from "@/components/onboarding/steps/Step4";
import { useRouter } from "next/navigation";

export default function OnboardingLayout() {
  const { state, next, back, setField, validate, handleStep3Next } = useOnboarding();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);

  const isLastStep = state.step === 4;
  const progress = (state.step / 4) * 100;
  const canSubmitStep = isLastStep ? true : state.canContinue;

  async function handleContinue() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (state.step === 3 && handleStep3Next) {
        await handleStep3Next();
        return;
      }
      if (!isLastStep) {
        validate();
        if (!state.canContinue) return;
      }
      // STEP 1: solo avanzamos (sin crear escuela todavia)
      if (state.step === 1) {
        next();
        return;
      }
      // STEP 2: solo avanzamos (categorias se guardan al final)
      if (state.step === 2) {
        next();
        return;
      }
      // STEP 4 (FINAL)
      if (isLastStep) {
        await handleSubmit();
        router.push("/schools");
        return;
      }
    } catch (e) {
      console.error("Onboarding error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {

    // Guardar lat/lng desde el onboarding
    const school = await schoolsService.create({
      name: state.data.schoolName.trim(),
      description: state.data.description?.trim() || undefined,
      latitude: state.data.lat ?? undefined,
      longitude: state.data.lng ?? undefined,
    });

    setField("schoolId", school.id);

    const categoryIds = state.data.categories.map((c) => c.id);
    if (categoryIds.length > 0) {
      await schoolCategoriesService.assign(categoryIds);
    }

    await schoolsService.update({
      educationalLevel: state.data.educationalLevel || undefined,
      institutionType: state.data.institutionType || undefined,
      city: state.data.city || undefined,
      address: state.data.address || undefined,
      latitude: state.data.lat ?? undefined,
      longitude: state.data.lng ?? undefined,
    });
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-8">
      {/* HEADER */}
      <div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-black rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 text-sm text-gray-500">Paso {state.step} de 4</p>
      </div>

      {/* STEP CONTENT */}
      <div className="flex-1 flex justify-center">
        {state.step === 1 && <Step1 />}
        {state.step === 2 && <Step2 />}
        {state.step === 3 && <Step3 />}
        {state.step === 4 && <Step4 />}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between mt-8">
        <button
          onClick={back}
          disabled={state.step === 1 || submitting}
          className="px-6 py-2 border rounded disabled:opacity-30"
        >
          Volver
        </button>

        <button
          onClick={handleContinue}
          disabled={!canSubmitStep || submitting}
          className="px-6 py-2 bg-black text-white rounded disabled:opacity-30"
        >
          {submitting ? "Guardando..." : isLastStep ? "Finalizar" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
