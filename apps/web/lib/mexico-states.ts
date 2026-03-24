export const MEXICO_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de Mexico",
  "Coahuila",
  "Colima",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Mexico",
  "Michoacan",
  "Morelos",
  "Nayarit",
  "Nuevo Leon",
  "Oaxaca",
  "Puebla",
  "Queretaro",
  "Quintana Roo",
  "San Luis Potosi",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatan",
  "Zacatecas",
] as const;

const STATE_ALIASES: Record<string, string> = {
  cdmx: "Ciudad de Mexico",
  "ciudad de mexico": "Ciudad de Mexico",
  "distrito federal": "Ciudad de Mexico",
  df: "Ciudad de Mexico",
  "edo mex": "Mexico",
  "estado de mexico": "Mexico",
  michoacan: "Michoacan",
  "nuevo leon": "Nuevo Leon",
  yucatan: "Yucatan",
  queretaro: "Queretaro",
  "san luis potosi": "San Luis Potosi",
};

export function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveMexicanState(input?: string): string | undefined {
  if (!input) return undefined;

  const normalized = normalizeSearchValue(input);
  if (!normalized) return undefined;

  const alias = STATE_ALIASES[normalized];
  if (alias) return alias;

  return MEXICO_STATES.find((state) => normalizeSearchValue(state) === normalized);
}
