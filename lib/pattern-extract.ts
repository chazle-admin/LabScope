import type { LlmBiomarker, LlmExtraction } from "./schema";
import { BIOMARKER_DICTIONARY } from "./translate";
import { deriveSex } from "./classify";
import { slugify } from "./utils";

/**
 * Deterministic pattern-based extractor used when no LLM API key is configured.
 *
 * Designed for Spanish SNB-style reports (and close variants), it:
 *   • finds the patient block (Sexo, F. Nac., date headers)
 *   • walks each line, matching biomarker patterns of the form
 *     "<name>  <value> <unit> [ <low> - <high> ]" or "<name>  <value> <unit> [ < upper ]"
 *   • maps each line to our canonical biomarker dictionary so names come
 *     out in English with the correct slug for classification.
 *
 * The goal here is NOT to handle every possible lab report — that's the
 * LLM's job — but to give reviewers a zero-config path to see the full
 * pipeline on the provided sample. It also serves as a graceful fallback
 * if the LLM is temporarily unavailable.
 */
export function patternExtract(text: string): LlmExtraction {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const patient = extractPatient(lines);
  const biomarkers: LlmBiomarker[] = [];

  let currentCategory = "Other";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const cat = detectCategory(line);
    if (cat) {
      currentCategory = cat;
      continue;
    }

    const row = parseLine(line, currentCategory);
    if (row) biomarkers.push(row);
  }

  return {
    patient: {
      name: patient.name,
      sex: patient.sex,
      dateOfBirth: patient.dateOfBirth,
      reportDate: patient.reportDate,
      laboratoryName: patient.laboratoryName,
      laboratoryId: patient.laboratoryId,
    },
    sourceLanguage: guessLanguage(text),
    biomarkers: dedupe(biomarkers),
  };
}

function guessLanguage(text: string): string {
  const t = text.toLowerCase();
  if (/hemat[ií]es|hemoglobina|leucocitos|plaquetas|hombre|mujer|suero/.test(t)) return "es";
  if (/hematocrit|hemoglobin|platelets|serum/.test(t)) return "en";
  if (/h[ée]moglobine|plaquettes|h[ée]matocrite/.test(t)) return "fr";
  if (/h[äa]moglobin|blutpl[äa]ttchen/.test(t)) return "de";
  return "unknown";
}

type PatientRaw = {
  name: string | null;
  sex: "male" | "female" | "unknown";
  dateOfBirth: string | null;
  reportDate: string | null;
  laboratoryName: string | null;
  laboratoryId: string | null;
};

function extractPatient(lines: string[]): PatientRaw {
  const p: PatientRaw = {
    name: null,
    sex: "unknown",
    dateOfBirth: null,
    reportDate: null,
    laboratoryName: null,
    laboratoryId: null,
  };

  for (const line of lines) {
    const sexMatch = /sexo\s*:\s*(hombre|mujer|male|female|varon|varón|masculino|femenino)/i.exec(line);
    if (sexMatch) p.sex = deriveSex(sexMatch[1]);

    const dobMatch = /(?:f\.?\s*nac|fecha\s+(?:de\s+)?nacimiento|dob|date\s+of\s+birth|birth\s+date)\.?\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})/i.exec(line);
    if (dobMatch) p.dateOfBirth = dobMatch[1];

    const repMatch = /(?:fecha\s+informe|fecha\s+validaci[oó]n|report\s+date)\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})/i.exec(line);
    if (repMatch) p.reportDate = repMatch[1];

    const dateHeader = /^(\d{2}\/\d{2}\/\d{4})\s+\d{1,2}:\d{2}\.?\d{0,2}\s+P[aá]gina/i.exec(line);
    if (dateHeader && !p.reportDate) p.reportDate = dateHeader[1];

    const lab = /\bn[ºo°]\s*lab\.?\s*:\s*([A-Z][A-Z0-9\-_.]{2,})/i.exec(line);
    if (lab) p.laboratoryId = lab[1];

    if (!p.laboratoryName) {
      const labName = /(SNB Diagn[oó]sticos Globales|[A-Z][A-Z\s&]+LAB[A-Z]*|Eurofins\s+[A-Z][A-Za-z\s]+)/i.exec(line);
      if (labName) p.laboratoryName = labName[1].trim();
    }
  }
  return p;
}

const CATEGORY_HEADERS: Array<[RegExp, string]> = [
  [/^hemograma|serie\s+(?:eritrocitaria|leucocitaria|plaquetaria)/i, "Hematology"],
  [/^inmunohematolog/i, "Immunohematology"],
  [/metabolismo\s+hidrocarbonado|metabolismo\s+de\s+(?:la\s+)?glucosa|glucose\s+metabolism/i, "Glucose metabolism"],
  [/metabolismo\s+lipoprote|lipid\s+panel|perfil\s+lip[ií]dico/i, "Lipid panel"],
  [/prote[ií]nas\s*(?:\(suero\))?\s*$|inflamaci[oó]n|inflammation/i, "Proteins / Inflammation"],
  [/pruebas\s+de\s+funci[oó]n\s+renal|funci[oó]n\s+renal|renal\s+function|kidney/i, "Renal function"],
  [/pruebas\s+de\s+funci[oó]n\s+hep[aá]tica|liver\s+function|h[ií]gado/i, "Liver function"],
  [/tiroides|thyroid/i, "Thyroid"],
  [/vitaminas?|vitamins?/i, "Vitamins"],
  [/electrolitos?|minerales?|minerals?|electrolytes?/i, "Minerals / Electrolytes"],
];

function detectCategory(line: string): string | null {
  for (const [re, cat] of CATEGORY_HEADERS) {
    if (re.test(line)) return cat;
  }
  return null;
}

const UNIT_RE =
  `(?:mg/dL|mg/L|g/dL|g/L|mmol/L|mmol/mol|umol/L|µmol/L|μmol/L|ng/mL|ng/dL|pg/mL|pmol/L|U/L|IU/L|uIU/mL|µIU/mL|mIU/L|%|fL|pg|x10[³3\\^]?(?:/mm[³3]|/uL)?|x10[⁶6\\^]?(?:/mm[³3]|/uL)?|10\\^[36]/uL)`;

function parseLine(line: string, category: string): LlmBiomarker | null {
  if (/^p[aá]gina\s+\d+/i.test(line)) return null;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(line)) return null;
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}/.test(line)) return null;
  if (/^solamente\s+est[aá]n/i.test(line)) return null;
  if (/^nombre\s*:|^cargo\s*:|^doctor\s*:|^origen\s*:|^fecha\s+/i.test(line)) return null;
  if (/^metabolismo|^serie\s+|^pruebas\s+de|^inmunohematolog|^hemograma|^sangre\s+total|^prote[ií]nas\s*\(suero\)/i.test(line)) return null;
  if (/^se\s+consideran|^valores\s+de|^-\s+(?:prevenci|rcv)/i.test(line)) return null;

  const valueUnitRange = new RegExp(
    `^(?<name>.+?)\\s+(?:ü\\s+)?(?:\\*\\s*)?(?<value><?\\s*-?\\d+(?:[.,]\\d+)?|<\\s*0(?:,\\d+)?|Positivo|Negativo|[A-Z]+|Positive|Negative)\\s*(?<unit>${UNIT_RE})?\\s*\\[\\s*(?<rng>[^\\]]+?)\\s*\\]\\s*$`,
  );

  const m = valueUnitRange.exec(line);
  if (m) {
    const raw = m.groups as Record<string, string>;
    return buildRow(raw.name, raw.value, raw.unit ?? null, raw.rng, category);
  }

  // Some values carry a "ü" validation glyph and no explicit bracketed range (e.g. qualitative results)
  const qual = /^(?<name>.+?)\s+(?<value>Positivo|Negativo|Positive|Negative|A|B|AB|O|[A-Z]{1,3})\s*$/.exec(line);
  if (qual) {
    const raw = qual.groups as Record<string, string>;
    return buildRow(raw.name, raw.value, null, null, category);
  }

  return null;
}

function buildRow(
  name: string,
  value: string,
  unit: string | null,
  refText: string | null,
  category: string,
): LlmBiomarker | null {
  const nameClean = name.replace(/[ü*]\s*$/g, "").trim();
  if (nameClean.length < 2) return null;

  const isPct =
    /\s%\s*$/.test(nameClean) ||
    /\(%\)\s*$/.test(nameClean) ||
    /%\s*$/.test(nameClean);
  const baseSlug = slugify(nameClean);
  const pctSlug = baseSlug + "_pct";
  const dict =
    (isPct && BIOMARKER_DICTIONARY[pctSlug]) ||
    BIOMARKER_DICTIONARY[baseSlug] ||
    matchDictionaryLoose(nameClean);
  const english = dict?.english ?? nameClean;

  const valueText = value.trim();
  const numeric = parseSpanishNumber(valueText);

  let refLow: number | null = null;
  let refHigh: number | null = null;
  if (refText) {
    const parsed = parseRangeText(refText);
    refLow = parsed.low;
    refHigh = parsed.high;
  }

  return {
    nameOriginal: nameClean,
    nameEnglish: english,
    valueNumeric: numeric,
    valueText,
    unitOriginal: unit,
    unitEnglish: unit,
    refLow,
    refHigh,
    refText: refText ? refText.trim() : null,
    category,
    notes: null,
  };
}

const DICT_KEYS_BY_LENGTH = Object.keys(BIOMARKER_DICTIONARY).sort(
  (a, b) => b.length - a.length,
);

function matchDictionaryLoose(nameClean: string) {
  const s = slugify(nameClean);
  for (const key of DICT_KEYS_BY_LENGTH) {
    if (
      s === key ||
      s.startsWith(key + "_") ||
      s.endsWith("_" + key) ||
      s.includes("_" + key + "_")
    ) {
      return BIOMARKER_DICTIONARY[key];
    }
  }
  return null;
}

function parseSpanishNumber(v: string): number | null {
  if (!v) return null;
  const cleaned = v.replace(/[<>]/g, "").trim();
  if (!cleaned) return null;
  const normalized = cleaned.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseRangeText(raw: string): { low: number | null; high: number | null } {
  const s = raw.trim();
  const lt = /^<\s*(-?\d+(?:[.,]\d+)?)/.exec(s);
  if (lt) return { low: null, high: parseSpanishNumber(lt[1]) };
  const gt = /^>\s*(-?\d+(?:[.,]\d+)?)/.exec(s);
  if (gt) return { low: parseSpanishNumber(gt[1]), high: null };
  const rg = /(-?\d+(?:[.,]\d+)?)\s*[-–]\s*(-?\d+(?:[.,]\d+)?)/.exec(s);
  if (rg) return { low: parseSpanishNumber(rg[1]), high: parseSpanishNumber(rg[2]) };
  return { low: null, high: null };
}

function dedupe(rows: LlmBiomarker[]): LlmBiomarker[] {
  const seen = new Set<string>();
  const out: LlmBiomarker[] = [];
  for (const r of rows) {
    const key = `${slugify(r.nameOriginal)}::${r.valueText}::${r.unitOriginal ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
