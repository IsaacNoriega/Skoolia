"use client";

import { useToast } from "@/components/ui/toast";
import React, { createContext, useReducer, useContext, useCallback } from "react";

type OnboardingStep = 1 | 2 | 3 | 4;

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface OnboardingState {
  step: OnboardingStep;

  data: {
    schoolId?: string;
    schoolName: string;
    website: string;

    educationalLevel: string;
    institutionType: string;
    description: string;

    city: string;
    address: string;
    lat: number | null;
    lng: number | null;

    categories: Category[];
  };

  errors: Partial<Record<keyof OnboardingState["data"], string>>;
  canContinue: boolean;
}

/* =========================
   VALIDACIÓN POR STEP
========================= */

function validateStep(state: OnboardingState) {
  const errors: OnboardingState["errors"] = {};

  if (state.step === 1) {
    if (!state.data.schoolName.trim()) {
      errors.schoolName = "El nombre de la escuela es obligatorio";
    }
  }

  if (state.step === 2) {
    if (state.data.categories.length === 0) {
      errors.categories = "Selecciona al menos una categoría";
    }
  }

  if (state.step === 3) {
    if (!state.data.educationalLevel.trim()) {
      errors.educationalLevel = "El nivel educativo es obligatorio";
    }

    if (!state.data.institutionType.trim()) {
      errors.institutionType = "Selecciona el tipo de institucion";
    }

    if (!state.data.city.trim()) {
      errors.city = "Selecciona un estado";
    }
  }

  if (state.step === 4) {
  }

  return {
    errors,
    canContinue: Object.keys(errors).length === 0,
  };
}

/* =========================
   ACTIONS
========================= */

type DataKey = keyof OnboardingState["data"];
type DataValue<K extends DataKey> = OnboardingState["data"][K];

type Action =
  | { type: "SET_FIELD"; field: DataKey; value: OnboardingState["data"][DataKey] }
  | { type: "TOGGLE_CATEGORY"; category: Category }
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "VALIDATE" }
  | { type: "RESET" };

const initialState: OnboardingState = {
  step: 1,
  data: {
    schoolId: undefined,
    schoolName: "",
    website: "",

    educationalLevel: "",
    institutionType: "",
    description: "",

    city: "",
    address: "",
    lat: null,
    lng: null,
    categories: [],
  },
  errors: {},
  canContinue: false,
};

/* =========================
   REDUCER
========================= */

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "SET_FIELD": {
      const newState: OnboardingState = {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        } as OnboardingState["data"],
      };

      const validation = validateStep(newState);

      return {
        ...newState,
        errors: validation.errors,
        canContinue: validation.canContinue,
      };
    }

    case "TOGGLE_CATEGORY": {
      const exists = state.data.categories.find((c) => c.id === action.category.id);

      const updatedCategories = exists
        ? state.data.categories.filter((c) => c.id !== action.category.id)
        : [...state.data.categories, action.category];

      const newState: OnboardingState = {
        ...state,
        data: {
          ...state.data,
          categories: updatedCategories,
        },
      };

      const validation = validateStep(newState);

      return {
        ...newState,
        errors: validation.errors,
        canContinue: validation.canContinue,
      };
    }

    case "VALIDATE": {
      const validation = validateStep(state);
      return {
        ...state,
        errors: validation.errors,
        canContinue: validation.canContinue,
      };
    }

    case "NEXT_STEP": {
      const validation = validateStep(state);

      if (!validation.canContinue) {
        return {
          ...state,
          errors: validation.errors,
          canContinue: false,
        };
      }

      const nextStep = (state.step + 1) as OnboardingStep;

      return {
        ...state,
        step: nextStep > 4 ? 4 : nextStep,
        errors: {},
        canContinue: false,
      };
    }

    case "PREVIOUS_STEP": {
      const prevStep = (state.step - 1) as OnboardingStep;

      return {
        ...state,
        step: prevStep < 1 ? 1 : prevStep,
        errors: {},
        canContinue: true,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/* =========================
   CONTEXT
========================= */

type OnboardingContextType = {
  state: OnboardingState;
  setField: <K extends DataKey>(field: K, value: DataValue<K>) => void;
  next: () => void;
  back: () => void;
  validate: () => void;
  reset: () => void;
  toggleCategory: (category: Category) => void;
  handleStep3Next?: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showToast } = useToast();

  // Handler global para el paso 3 (geocodificación)
  const handleStep3Next = useCallback(async () => {
    // Usar dispatch directamente para evitar ReferenceError
    value.validate();
    if (!state.canContinue) return;
    const address = state.data.address;
    const city = state.data.city;
    if (address && city) {
      const query = encodeURIComponent(`${address}, ${city}, México`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
      try {
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'es', 'User-Agent': 'Skoolia/1.0 (contacto@skoolia.mx)' },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          dispatch({ type: "SET_FIELD", field: "lat", value: parseFloat(data[0].lat) });
          dispatch({ type: "SET_FIELD", field: "lng", value: parseFloat(data[0].lon) });
          showToast({
            title: "Coordenadas encontradas",
            description: `Latitud: ${parseFloat(data[0].lat).toFixed(6)}, Longitud: ${parseFloat(data[0].lon).toFixed(6)}`,
            variant: "success",
          });
        } else {
          dispatch({ type: "SET_FIELD", field: "lat", value: null });
          dispatch({ type: "SET_FIELD", field: "lng", value: null });
          showToast({
            title: "No se pudo geocodificar la dirección",
            description: "Verifica que la dirección y el estado sean correctos. Puedes continuar, pero las coordenadas no se guardarán.",
            variant: "error",
          });
        }
      } catch {
        dispatch({ type: "SET_FIELD", field: "lat", value: null });
        dispatch({ type: "SET_FIELD", field: "lng", value: null });
        showToast({
          title: "No se pudo geocodificar la dirección",
          description: "Verifica que la dirección y el estado sean correctos. Puedes continuar, pero las coordenadas no se guardarán.",
          variant: "error",
        });
      }
    } else {
      dispatch({ type: "SET_FIELD", field: "lat", value: null });
      dispatch({ type: "SET_FIELD", field: "lng", value: null });
    }
    dispatch({ type: "NEXT_STEP" });
  }, [state, dispatch, showToast]);

  const value: OnboardingContextType = {
    state,
    setField: (field, value) => dispatch({ type: "SET_FIELD", field, value }),
    next: () => dispatch({ type: "NEXT_STEP" }),
    back: () => dispatch({ type: "PREVIOUS_STEP" }),
    validate: () => dispatch({ type: "VALIDATE" }),
    reset: () => dispatch({ type: "RESET" }),
    toggleCategory: (category) => dispatch({ type: "TOGGLE_CATEGORY", category }),
    handleStep3Next,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used dentro del Provider');
  return context;
}