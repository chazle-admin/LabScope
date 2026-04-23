import type { Sex } from "./schema";

/**
 * Optimal-range reference database.
 *
 * The "normal" range in a lab report is a statistical interval (the central
 * 95% of a reference population) — a value inside it is not necessarily
 * healthy. The "optimal" range is the tighter clinical target associated
 * with the lowest long-term risk, based on published guidelines
 * (ADA, ESC/EAS, NCEP ATP III, NHANES, etc.).
 *
 * Every entry is keyed by a canonical slug. Ranges are expressed in the
 * canonical unit for that analyte; conversion factors are declared when
 * the source value arrives in an alternative unit.
 *
 * If `sex` or age bounds are set, the rule only applies to matching patients.
 * The classifier picks the most specific matching rule.
 */
export type UnitAlias = {
  unit: string;
  toCanonical: number;
};

export type RefRule = {
  slug: string;
  canonicalUnit: string;
  aliases?: UnitAlias[];
  optimalLow?: number;
  optimalHigh?: number;
  normalLow?: number;
  normalHigh?: number;
  sex?: Sex;
  ageMin?: number;
  ageMax?: number;
  source: string;
};

export const REFERENCE_RANGES: RefRule[] = [
  // ───── Hematology ─────
  {
    slug: "hemoglobin",
    canonicalUnit: "g/dL",
    aliases: [{ unit: "g/L", toCanonical: 0.1 }],
    optimalLow: 14,
    optimalHigh: 17,
    sex: "male",
    source: "NHANES / Harrison's Principles of Internal Medicine",
  },
  {
    slug: "hemoglobin",
    canonicalUnit: "g/dL",
    aliases: [{ unit: "g/L", toCanonical: 0.1 }],
    optimalLow: 13,
    optimalHigh: 15.5,
    sex: "female",
    source: "NHANES / Harrison's Principles of Internal Medicine",
  },
  {
    slug: "hematocrit",
    canonicalUnit: "%",
    optimalLow: 40,
    optimalHigh: 48,
    sex: "male",
    source: "Mayo Clinic",
  },
  {
    slug: "hematocrit",
    canonicalUnit: "%",
    optimalLow: 37,
    optimalHigh: 45,
    sex: "female",
    source: "Mayo Clinic",
  },
  {
    slug: "red_blood_cells",
    canonicalUnit: "10^6/uL",
    aliases: [
      { unit: "x10^6/mm^3", toCanonical: 1 },
      { unit: "x10⁶/mm³", toCanonical: 1 },
      { unit: "10^6/mm^3", toCanonical: 1 },
      { unit: "M/uL", toCanonical: 1 },
      { unit: "T/L", toCanonical: 1 },
    ],
    optimalLow: 4.5,
    optimalHigh: 5.5,
    sex: "male",
    source: "Mayo Clinic",
  },
  {
    slug: "red_blood_cells",
    canonicalUnit: "10^6/uL",
    aliases: [
      { unit: "x10^6/mm^3", toCanonical: 1 },
      { unit: "x10⁶/mm³", toCanonical: 1 },
      { unit: "10^6/mm^3", toCanonical: 1 },
      { unit: "M/uL", toCanonical: 1 },
      { unit: "T/L", toCanonical: 1 },
    ],
    optimalLow: 4.2,
    optimalHigh: 5.2,
    sex: "female",
    source: "Mayo Clinic",
  },
  {
    slug: "white_blood_cells",
    canonicalUnit: "10^3/uL",
    aliases: [
      { unit: "x10^3/mm^3", toCanonical: 1 },
      { unit: "x10³/mm³", toCanonical: 1 },
      { unit: "K/uL", toCanonical: 1 },
      { unit: "G/L", toCanonical: 1 },
    ],
    optimalLow: 4.5,
    optimalHigh: 7.5,
    source: "Mayo Clinic / longevity literature",
  },
  {
    slug: "platelets",
    canonicalUnit: "10^3/uL",
    aliases: [
      { unit: "x10^3/mm^3", toCanonical: 1 },
      { unit: "x10³/mm³", toCanonical: 1 },
      { unit: "K/uL", toCanonical: 1 },
      { unit: "G/L", toCanonical: 1 },
    ],
    optimalLow: 175,
    optimalHigh: 300,
    source: "Mayo Clinic",
  },
  {
    slug: "mcv",
    canonicalUnit: "fL",
    optimalLow: 85,
    optimalHigh: 95,
    source: "Mayo Clinic",
  },
  {
    slug: "mch",
    canonicalUnit: "pg",
    optimalLow: 28,
    optimalHigh: 32,
    source: "Mayo Clinic",
  },
  {
    slug: "mchc",
    canonicalUnit: "g/dL",
    optimalLow: 33,
    optimalHigh: 35,
    source: "Mayo Clinic",
  },
  {
    slug: "rdw",
    canonicalUnit: "%",
    optimalLow: 11.5,
    optimalHigh: 13,
    source: "Archives of Internal Medicine (Perlstein 2009)",
  },

  // ───── Glucose metabolism ─────
  {
    slug: "glucose",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 18.0156 }],
    optimalLow: 70,
    optimalHigh: 90,
    source: "ADA 2024 / optimal fasting glucose for metabolic health",
  },
  {
    slug: "hba1c_ngsp",
    canonicalUnit: "%",
    optimalLow: 4.5,
    optimalHigh: 5.2,
    source: "ADA 2024 — <5.7% normal, <5.3% optimal for longevity",
  },
  {
    slug: "hba1c_ifcc",
    canonicalUnit: "mmol/mol",
    optimalLow: 26,
    optimalHigh: 33,
    source: "ADA 2024 / IFCC conversion",
  },

  // ───── Lipids (ESC/EAS 2019, low CV risk) ─────
  {
    slug: "total_cholesterol",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 38.67 }],
    optimalLow: 130,
    optimalHigh: 190,
    source: "ESC/EAS 2019",
  },
  {
    slug: "ldl_cholesterol",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 38.67 }],
    optimalLow: 0,
    optimalHigh: 100,
    source: "ESC/EAS 2019 — optimal <100 mg/dL for low CV risk adults",
  },
  {
    slug: "hdl_cholesterol",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 38.67 }],
    optimalLow: 50,
    optimalHigh: 90,
    sex: "male",
    source: "Framingham / ESC",
  },
  {
    slug: "hdl_cholesterol",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 38.67 }],
    optimalLow: 60,
    optimalHigh: 100,
    sex: "female",
    source: "Framingham / ESC",
  },
  {
    slug: "non_hdl_cholesterol",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 38.67 }],
    optimalLow: 0,
    optimalHigh: 130,
    source: "ESC/EAS 2019",
  },
  {
    slug: "triglycerides",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 88.57 }],
    optimalLow: 0,
    optimalHigh: 100,
    source: "ESC/EAS 2019",
  },
  {
    slug: "apolipoprotein_b",
    canonicalUnit: "mg/dL",
    optimalLow: 0,
    optimalHigh: 90,
    source: "ESC/EAS 2019",
  },
  {
    slug: "lipoprotein_a",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "nmol/L", toCanonical: 0.4167 }],
    optimalLow: 0,
    optimalHigh: 30,
    source: "ESC/EAS 2019",
  },

  // ───── Proteins / inflammation ─────
  {
    slug: "total_protein",
    canonicalUnit: "g/L",
    aliases: [{ unit: "g/dL", toCanonical: 10 }],
    optimalLow: 65,
    optimalHigh: 78,
    source: "Mayo Clinic",
  },
  {
    slug: "albumin",
    canonicalUnit: "g/L",
    aliases: [{ unit: "g/dL", toCanonical: 10 }],
    optimalLow: 40,
    optimalHigh: 50,
    source: "Mayo Clinic / longevity literature (higher albumin = lower mortality)",
  },
  {
    slug: "c_reactive_protein",
    canonicalUnit: "mg/L",
    aliases: [{ unit: "mg/dL", toCanonical: 10 }],
    optimalLow: 0,
    optimalHigh: 1,
    source: "AHA high-risk threshold for hsCRP",
  },

  // ───── Renal ─────
  {
    slug: "creatinine",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "umol/L", toCanonical: 0.01131 }],
    optimalLow: 0.7,
    optimalHigh: 1.1,
    sex: "male",
    source: "Mayo Clinic",
  },
  {
    slug: "creatinine",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "umol/L", toCanonical: 0.01131 }],
    optimalLow: 0.55,
    optimalHigh: 0.95,
    sex: "female",
    source: "Mayo Clinic",
  },
  {
    slug: "uric_acid",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "umol/L", toCanonical: 0.01681 }],
    optimalLow: 3.5,
    optimalHigh: 5.5,
    sex: "male",
    source: "Clinical longevity literature (gout + CV risk)",
  },
  {
    slug: "uric_acid",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "umol/L", toCanonical: 0.01681 }],
    optimalLow: 2.5,
    optimalHigh: 5,
    sex: "female",
    source: "Clinical longevity literature",
  },
  {
    slug: "egfr",
    canonicalUnit: "mL/min/1.73m^2",
    optimalLow: 90,
    optimalHigh: 200,
    source: "KDIGO",
  },
  {
    slug: "urea",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 2.8 }],
    optimalLow: 15,
    optimalHigh: 35,
    source: "Mayo Clinic",
  },
  {
    slug: "bun",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 2.8 }],
    optimalLow: 7,
    optimalHigh: 16,
    source: "Mayo Clinic",
  },

  // ───── Liver ─────
  {
    slug: "alt",
    canonicalUnit: "U/L",
    optimalLow: 0,
    optimalHigh: 30,
    sex: "male",
    source: "ACG 2017 — true-normal ALT ≤30 (M) / ≤19 (F)",
  },
  {
    slug: "alt",
    canonicalUnit: "U/L",
    optimalLow: 0,
    optimalHigh: 19,
    sex: "female",
    source: "ACG 2017",
  },
  {
    slug: "ast",
    canonicalUnit: "U/L",
    optimalLow: 0,
    optimalHigh: 30,
    source: "ACG 2017",
  },
  {
    slug: "ggt",
    canonicalUnit: "U/L",
    optimalLow: 0,
    optimalHigh: 30,
    source: "ACG 2017",
  },
  {
    slug: "alkaline_phosphatase",
    canonicalUnit: "U/L",
    optimalLow: 35,
    optimalHigh: 100,
    source: "Mayo Clinic",
  },
  {
    slug: "total_bilirubin",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "umol/L", toCanonical: 0.0585 }],
    optimalLow: 0.3,
    optimalHigh: 1.0,
    source: "Mayo Clinic",
  },

  // ───── Thyroid ─────
  {
    slug: "tsh",
    canonicalUnit: "uIU/mL",
    aliases: [{ unit: "mIU/L", toCanonical: 1 }],
    optimalLow: 1,
    optimalHigh: 2.5,
    source: "AACE / functional medicine optimal range",
  },
  {
    slug: "free_t4",
    canonicalUnit: "ng/dL",
    aliases: [{ unit: "pmol/L", toCanonical: 0.0777 }],
    optimalLow: 1.1,
    optimalHigh: 1.7,
    source: "AACE",
  },
  {
    slug: "free_t3",
    canonicalUnit: "pg/mL",
    aliases: [{ unit: "pmol/L", toCanonical: 0.651 }],
    optimalLow: 3.0,
    optimalHigh: 4.2,
    source: "AACE",
  },

  // ───── Vitamins / minerals ─────
  {
    slug: "vitamin_d_25oh",
    canonicalUnit: "ng/mL",
    aliases: [{ unit: "nmol/L", toCanonical: 0.4 }],
    optimalLow: 40,
    optimalHigh: 70,
    source: "Endocrine Society 2011 / longevity literature",
  },
  {
    slug: "vitamin_b12",
    canonicalUnit: "pg/mL",
    aliases: [{ unit: "pmol/L", toCanonical: 1.355 }],
    optimalLow: 500,
    optimalHigh: 1000,
    source: "Functional medicine optimal / Framingham",
  },
  {
    slug: "ferritin",
    canonicalUnit: "ng/mL",
    aliases: [{ unit: "ug/L", toCanonical: 1 }],
    optimalLow: 50,
    optimalHigh: 200,
    sex: "male",
    source: "BMJ 2014 / longevity",
  },
  {
    slug: "ferritin",
    canonicalUnit: "ng/mL",
    aliases: [{ unit: "ug/L", toCanonical: 1 }],
    optimalLow: 30,
    optimalHigh: 150,
    sex: "female",
    source: "BMJ 2014 / longevity",
  },
  {
    slug: "iron",
    canonicalUnit: "ug/dL",
    aliases: [{ unit: "umol/L", toCanonical: 5.587 }],
    optimalLow: 60,
    optimalHigh: 150,
    source: "Mayo Clinic",
  },
  {
    slug: "sodium",
    canonicalUnit: "mmol/L",
    optimalLow: 137,
    optimalHigh: 142,
    source: "NEJM sodium & mortality study",
  },
  {
    slug: "potassium",
    canonicalUnit: "mmol/L",
    optimalLow: 4.0,
    optimalHigh: 4.8,
    source: "Mayo Clinic",
  },
  {
    slug: "calcium",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 4.008 }],
    optimalLow: 9.2,
    optimalHigh: 10.2,
    source: "Mayo Clinic",
  },
  {
    slug: "magnesium",
    canonicalUnit: "mg/dL",
    aliases: [{ unit: "mmol/L", toCanonical: 2.431 }],
    optimalLow: 2.0,
    optimalHigh: 2.5,
    source: "Functional medicine",
  },
  {
    slug: "phosphorus",
    canonicalUnit: "mg/dL",
    optimalLow: 3.0,
    optimalHigh: 4.0,
    source: "Mayo Clinic",
  },

  // ───── WBC differential (%) ─────
  { slug: "neutrophils_pct", canonicalUnit: "%", optimalLow: 45, optimalHigh: 65, source: "Mayo Clinic" },
  { slug: "lymphocytes_pct", canonicalUnit: "%", optimalLow: 25, optimalHigh: 40, source: "Mayo Clinic" },
  { slug: "monocytes_pct", canonicalUnit: "%", optimalLow: 2, optimalHigh: 8, source: "Mayo Clinic" },
  { slug: "eosinophils_pct", canonicalUnit: "%", optimalLow: 0, optimalHigh: 4, source: "Mayo Clinic" },
  { slug: "basophils_pct", canonicalUnit: "%", optimalLow: 0, optimalHigh: 1, source: "Mayo Clinic" },

  // ───── MPV / misc ─────
  { slug: "mpv", canonicalUnit: "fL", optimalLow: 8, optimalHigh: 11, source: "Mayo Clinic" },

  // ───── Homocysteine / other CV markers ─────
  {
    slug: "homocysteine",
    canonicalUnit: "umol/L",
    optimalLow: 0,
    optimalHigh: 8,
    source: "Cardiovascular longevity literature",
  },
  {
    slug: "insulin",
    canonicalUnit: "uIU/mL",
    aliases: [{ unit: "mIU/L", toCanonical: 1 }, { unit: "pmol/L", toCanonical: 1 / 6.945 }],
    optimalLow: 2,
    optimalHigh: 7,
    source: "Functional medicine optimal fasting insulin",
  },
];

/**
 * Alias map from lowercased unit strings to their canonical form.
 * Conversion is then delegated to the rule's aliases. This is purely
 * for normalizing display-level variants like "μL" vs "uL".
 */
export const UNIT_CANONICAL: Record<string, string> = {
  "µl": "uL",
  "μl": "uL",
  "ul": "uL",
  "g/dl": "g/dL",
  "g/l": "g/L",
  "mg/dl": "mg/dL",
  "mg/l": "mg/L",
  "mmol/l": "mmol/L",
  "umol/l": "umol/L",
  "µmol/l": "umol/L",
  "μmol/l": "umol/L",
  "mmol/mol": "mmol/mol",
  "mg/mol": "mg/mol",
  "ng/ml": "ng/mL",
  "ng/dl": "ng/dL",
  "pg/ml": "pg/mL",
  "pmol/l": "pmol/L",
  "u/l": "U/L",
  "iu/l": "IU/L",
  "uiu/ml": "uIU/mL",
  "µiu/ml": "uIU/mL",
  "miu/l": "mIU/L",
  "%": "%",
  "fl": "fL",
  "pg": "pg",
  "x10^3/mm^3": "10^3/uL",
  "x10³/mm³": "10^3/uL",
  "10^3/mm^3": "10^3/uL",
  "10e3/mm3": "10^3/uL",
  "k/ul": "10^3/uL",
  "x10^6/mm^3": "10^6/uL",
  "x10⁶/mm³": "10^6/uL",
  "10^6/mm^3": "10^6/uL",
  "m/ul": "10^6/uL",
  "t/l": "10^6/uL",
};

export function canonicalizeUnit(unit: string | null | undefined): string | null {
  if (!unit) return null;
  const trimmed = unit.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase().replace(/\s+/g, "");
  return UNIT_CANONICAL[lower] ?? trimmed;
}

/**
 * Find the most specific reference rule for the given (slug, sex, age).
 * Specificity order: sex+age > sex > age > generic.
 */
export function findRule(
  slug: string,
  sex: Sex,
  age: number | null,
): RefRule | null {
  const matches = REFERENCE_RANGES.filter((r) => r.slug === slug).filter((r) => {
    if (r.sex && r.sex !== sex) return false;
    if (r.ageMin !== undefined && (age ?? -1) < r.ageMin) return false;
    if (r.ageMax !== undefined && (age ?? 999) > r.ageMax) return false;
    return true;
  });
  if (matches.length === 0) return null;
  matches.sort((a, b) => specificity(b) - specificity(a));
  return matches[0];
}

function specificity(r: RefRule): number {
  let s = 0;
  if (r.sex) s += 2;
  if (r.ageMin !== undefined) s += 1;
  if (r.ageMax !== undefined) s += 1;
  return s;
}
