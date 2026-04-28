const ALLOWED_PAGE_LIMITS = [10, 20, 50, 100, 200, 500] as const;

type AllowedPageLimit = (typeof ALLOWED_PAGE_LIMITS)[number];

function isAllowedPageLimit(value: number): value is AllowedPageLimit {
  return ALLOWED_PAGE_LIMITS.includes(value as AllowedPageLimit);
}

export function readPageLimit(storageKey: string, fallback = 20): number {
  if (typeof window === 'undefined') return fallback;

  const raw = window.localStorage.getItem(storageKey);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && isAllowedPageLimit(parsed)
    ? parsed
    : fallback;
}

export function savePageLimit(storageKey: string, limit: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, String(limit));
}
