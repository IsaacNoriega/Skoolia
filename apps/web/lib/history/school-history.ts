const STORAGE_KEY_PREFIX = "skoolia:school-history";
const AUTH_USER_ID_KEY = "skoolia:auth-user-id";
const ANON_USER_ID = "anon";
const MAX_ITEMS = 50;

export interface SchoolVisit {
  id: string;
  name: string;
  imageSrc: string;
  location: string;
  visitedAt: string; // ISO date
}

function resolveOwnerId(ownerId?: string): string {
  if (ownerId && ownerId.trim()) return ownerId;
  if (typeof window === "undefined") return ANON_USER_ID;

  const fromAuthCache = localStorage.getItem(AUTH_USER_ID_KEY);
  if (fromAuthCache && fromAuthCache.trim()) return fromAuthCache;

  return ANON_USER_ID;
}

function getStorageKey(ownerId?: string): string {
  return `${STORAGE_KEY_PREFIX}:${resolveOwnerId(ownerId)}`;
}

function readAll(ownerId?: string): SchoolVisit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(ownerId));
    if (!raw) return [];
    return JSON.parse(raw) as SchoolVisit[];
  } catch {
    return [];
  }
}

function writeAll(items: SchoolVisit[], ownerId?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(ownerId), JSON.stringify(items));
}

export function recordSchoolVisit(
  school: Omit<SchoolVisit, "visitedAt">,
  ownerId?: string,
): void {
  const all = readAll(ownerId).filter((v) => v.id !== school.id); // dedup: move to front
  const entry: SchoolVisit = { ...school, visitedAt: new Date().toISOString() };
  const updated = [entry, ...all].slice(0, MAX_ITEMS);
  writeAll(updated, ownerId);
}

export function getSchoolHistory(ownerId?: string): SchoolVisit[] {
  return readAll(ownerId);
}

export function clearSchoolHistory(ownerId?: string): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(getStorageKey(ownerId));
  }
}
