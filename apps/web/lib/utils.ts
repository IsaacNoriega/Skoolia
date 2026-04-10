import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeImageSrc(src?: string | null): string | undefined {
  if (!src) return undefined;

  const trimmed = src.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return undefined;
}

export function resolveSchoolCardImage(
  schoolId: string,
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const safe = sanitizeImageSrc(candidate);
    if (safe) return safe;
  }

  return `https://picsum.photos/seed/${encodeURIComponent(schoolId)}-card/1200/800`;
}
