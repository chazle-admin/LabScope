import type { Biomarker, LlmBiomarker, Patient, Sex, Status } from "./schema";
import { canonicalizeUnit, findRule } from "./reference-ranges";
import { englishToSlug, translateBiomarker } from "./translate";
import { slugify } from "./utils";

/**
 * Result of parsing a reference-range text (e.g. "[ 74 - 106 ]", "< 200",
 * "> 40"). Either bound may be null/Infinity if the text is one-sided.
 */
export type ParsedRange = { low: number | null; high: number | null };

export function parseReferenceText(raw: string | null | undefined): ParsedRange {
  if (!raw) return { low: null, high: null };
  const s = raw.replace(/[\[\]]/g, "").trim();

  // one-sided: < N
  const lt = /^<\s*(-?\d+(?:[.,]\d+)?)/.exec(s);
  if (lt) return { low: null, high: parseNum(lt[1]) };

  // one-sided: > N
  const gt = /^>\s*(-?\d+(?:[.,]\d+)?)/.exec(s);
  if (gt) return { low: parseNum(gt[1]), high: null };

  // range: N - M or N – M or N to M
  const rg = /(-?\d+(?:[.,]\d+)?)\s*[-–a]\s*(-?\d+(?:[.,]\d+)?)/.exec(s);
  if (rg) return { low: parseNum(rg[1]), high: parseNum(rg[2]) };

  return { low: null, high: null };
}

function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = v.replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Convert a value from its reported unit to the canonical unit of the
 * matching reference rule. Returns the original value unchanged if the
 * units already match (case-insensitive) or if no conversion is known.
 */
export function convertToCanonical(
  value: number,
  reportedUnit: string | null,
  ruleUnit: string,
  aliases?: { unit: string; toCanonical: number }[],
): number {
  if (reportedUnit === null) return value;
  const r = canonicalizeUnit(reportedUnit)?.toLowerCase().replace(/\s+/g, "") ?? "";
  const c = canonicalizeUnit(ruleUnit)?.toLowerCase().replace(/\s+/g, "") ?? "";
  if (r === c) return value;
  if (aliases) {
    for (const a of aliases) {
      const al = canonicalizeUnit(a.unit)?.toLowerCase().replace(/\s+/g, "") ?? "";
      if (al === r) return value * a.toCanonical;
    }
  }
  return value;
}

/**
 * Classify one biomarker against:
 *   (a) the reference range printed on the report (authoritative for "out of range"),
 *   (b) a curated optimal range from our rule base (authoritative for "optimal").
 *
 * Qualitative results (e.g. blood group "A", Rh "Positivo") are treated
 * as `normal` — they are informational, not ranged measurements.
 */
export function classifyBiomarker(raw: LlmBiomarker, patient: Patient): Biomarker {
  const translated = translateBiomarker(raw.nameOriginal, raw.nameEnglish);
  const slug = translated.slug || englishToSlug(raw.nameEnglish);
  const english = translated.english || raw.nameEnglish || raw.nameOriginal;
  const category = raw.category?.trim() || inferCategory(slug, english);

  const reportedRange: ParsedRange = {
    low: parseNum(raw.refLow),
    high: parseNum(raw.refHigh),
  };
  if (reportedRange.low === null && reportedRange.high === null) {
    const parsed = parseReferenceText(raw.refText);
    reportedRange.low = parsed.low;
    reportedRange.high = parsed.high;
  }

  const unitOriginal = raw.unitOriginal?.trim() || null;
  const unitEnglish = raw.unitEnglish?.trim() || canonicalizeUnit(unitOriginal);

  const rule = findRule(slug, patient.sex, patient.age);
  const canonicalUnit = rule?.canonicalUnit ?? unitEnglish ?? null;
  const canonicalValue =
    raw.valueNumeric !== null && rule
      ? convertToCanonical(raw.valueNumeric, unitOriginal, rule.canonicalUnit, rule.aliases)
      : raw.valueNumeric;

  let status: Status = "unknown";
  let statusReason = "No numeric value to classify";
  let optimalLow: number | null = null;
  let optimalHigh: number | null = null;

  const isQualitative =
    raw.valueNumeric === null &&
    !!raw.valueText &&
    !/^[<>≤≥]?\s*-?\d/.test(raw.valueText.trim());

  if (isQualitative) {
    status = "normal";
    statusReason = "Qualitative result (informational)";
  } else if (raw.valueNumeric !== null) {
    const v = canonicalValue ?? raw.valueNumeric;
    const low = reportedRange.low;
    const high = reportedRange.high;
    const hasLabRange = low !== null || high !== null;

    const outOfLabRange =
      hasLabRange &&
      ((low !== null && v < low) || (high !== null && v > high));

    if (outOfLabRange) {
      status = "out_of_range";
      statusReason = describeOutOfRange(v, low, high, unitEnglish ?? canonicalUnit);
    } else if (rule && (rule.optimalLow !== undefined || rule.optimalHigh !== undefined)) {
      optimalLow = rule.optimalLow ?? null;
      optimalHigh = rule.optimalHigh ?? null;
      const oLow = rule.optimalLow ?? -Infinity;
      const oHigh = rule.optimalHigh ?? Infinity;
      if (v >= oLow && v <= oHigh) {
        status = "optimal";
        statusReason = `Within curated optimal range (${formatRange(optimalLow, optimalHigh, rule.canonicalUnit)})`;
      } else if (hasLabRange) {
        status = "normal";
        statusReason = `Within lab reference but outside optimal range (${formatRange(optimalLow, optimalHigh, rule.canonicalUnit)})`;
      } else if (v >= (rule.normalLow ?? -Infinity) && v <= (rule.normalHigh ?? Infinity)) {
        status = "normal";
        statusReason = "Within built-in normal range (no reference printed on report)";
      } else {
        status = "out_of_range";
        statusReason = "Outside built-in reference range";
      }
    } else if (hasLabRange) {
      status = "normal";
      statusReason = `Within lab reference range (${formatRange(low, high, unitEnglish ?? canonicalUnit)})`;
    } else {
      status = "unknown";
      statusReason = "No reference range available";
    }
  } else if (raw.valueText) {
    const m = /^\s*([<>≤≥])\s*(-?\d+(?:[.,]\d+)?)/.exec(raw.valueText);
    if (m) {
      const op = m[1];
      const n = parseNum(m[2])!;
      if (reportedRange.high !== null && (op === "<" || op === "≤")) {
        status = n <= reportedRange.high ? "normal" : "unknown";
        statusReason =
          n <= reportedRange.high
            ? `Reported as ${raw.valueText}, below upper limit ${reportedRange.high}`
            : "Inequality cannot be classified";
      } else if (reportedRange.low !== null && (op === ">" || op === "≥")) {
        status = n >= reportedRange.low ? "normal" : "unknown";
      } else {
        status = "normal";
        statusReason = `Reported as ${raw.valueText} (within detection limits)`;
      }
    }
  }

  return {
    name: english,
    nameOriginal: raw.nameOriginal,
    valueNumeric: raw.valueNumeric,
    valueText: raw.valueText,
    unit: unitEnglish ?? unitOriginal,
    unitOriginal,
    refLow: reportedRange.low,
    refHigh: reportedRange.high,
    refText: raw.refText ?? null,
    category,
    status,
    statusReason,
    optimalLow,
    optimalHigh,
    notes: raw.notes ?? null,
  };
}

function describeOutOfRange(
  v: number,
  low: number | null,
  high: number | null,
  unit: string | null,
): string {
  const u = unit ? ` ${unit}` : "";
  if (low !== null && v < low) return `Below lab reference range (< ${low}${u})`;
  if (high !== null && v > high) return `Above lab reference range (> ${high}${u})`;
  return "Outside lab reference range";
}

function formatRange(
  low: number | null,
  high: number | null,
  unit: string | null,
): string {
  const u = unit ? ` ${unit}` : "";
  if (low !== null && high !== null) return `${low} – ${high}${u}`;
  if (low !== null) return `> ${low}${u}`;
  if (high !== null) return `< ${high}${u}`;
  return "—";
}

/**
 * Lightweight fallback categorizer used when the LLM returns a blank
 * category. Keeps the UI grouping sane even under degraded extraction.
 */
function inferCategory(slug: string, english: string): string {
  const s = slugify(english + " " + slug);
  if (/(hemoglobin|hematocrit|red_blood|white_blood|platelets|neutroph|lymph|mcv|mch|rdw|mpv|basoph|eosino|mono)/.test(s)) {
    return "Hematology";
  }
  if (/(glucose|hba1c|insulin)/.test(s)) return "Glucose metabolism";
  if (/(cholesterol|ldl|hdl|triglyc|apolipo|lipoprotein)/.test(s)) return "Lipid panel";
  if (/(protein|albumin|crp|c_reactive)/.test(s)) return "Proteins / Inflammation";
  if (/(creatinine|urea|bun|urate|uric|egfr)/.test(s)) return "Renal function";
  if (/(alt|ast|ggt|alkaline|bilirubin)/.test(s)) return "Liver function";
  if (/(tsh|t4|t3|thyroid)/.test(s)) return "Thyroid";
  if (/(vitamin|folate|b12|d_25)/.test(s)) return "Vitamins";
  if (/(sodium|potassium|calcium|magnesium|chloride|phosphorus|iron|ferritin|transferrin)/.test(s)) {
    return "Minerals / Electrolytes";
  }
  if (/(blood_group|rh)/.test(s)) return "Immunohematology";
  return "Other";
}

export function summarize(biomarkers: Biomarker[]) {
  const acc = { total: 0, optimal: 0, normal: 0, outOfRange: 0, unknown: 0 };
  for (const b of biomarkers) {
    acc.total++;
    if (b.status === "optimal") acc.optimal++;
    else if (b.status === "normal") acc.normal++;
    else if (b.status === "out_of_range") acc.outOfRange++;
    else acc.unknown++;
  }
  return acc;
}

export function deriveSex(raw: string | null | undefined): Sex {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().trim();
  if (/^(m|male|man|hombre|masculino|varón|varon|h)$/.test(s)) return "male";
  if (/^(f|female|woman|mujer|femenino|femme)$/.test(s)) return "female";
  if (s === "male") return "male";
  if (s === "female") return "female";
  return "unknown";
}
