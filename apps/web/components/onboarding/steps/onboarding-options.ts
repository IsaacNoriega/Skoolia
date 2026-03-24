import { MEXICO_STATES } from "@/lib/mexico-states";

export const institutionTypeOptions = [
  'Publica',
  'Privada',
  'Mixta',
  'Religiosa',
  'Laica',
  'Bilingue',
] as const;

export const stateOptions = MEXICO_STATES;
export const cityOptions = stateOptions;

