import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate age in whole years given a date of birth and a reference date.
 * Handles DOB strings in multiple formats (ISO, DD/MM/YYYY, MM/DD/YYYY).
 */
export function calculateAge(
  dob: string | Date | null | undefined,
  reference: string | Date = new Date(),
): number | null {
  if (!dob) return null;
  const birth = typeof dob === "string" ? parseFlexibleDate(dob) : dob;
  const ref = typeof reference === "string" ? parseFlexibleDate(reference) : reference;
  if (!birth || !ref || Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) {
    return null;
  }
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age >= 0 && age <= 130 ? age : null;
}

/**
 * Parse date strings in common formats.
 * Prefers DD/MM/YYYY (European) over MM/DD/YYYY since the sample report is Spanish.
 */
export function parseFlexibleDate(input: string): Date | null {
  if (!input) return null;
  const s = input.trim();

  // ISO: 2024-02-13, 2024-02-13T12:34:56Z
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (iso) {
    const [, y, m, d] = iso;
    return new Date(Date.UTC(+y, +m - 1, +d));
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const eu = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
  if (eu) {
    const [, d, m, y] = eu;
    const day = +d;
    const month = +m;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(+y, month - 1, day));
    }
  }

  // Fallback: let JS try
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseFlexibleDate(d) : d;
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Slugify a biomarker name for consistent lookups (lowercase, ASCII-only, kebab-case).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
