/**
 * Deterministic fallback dictionary for biomarker names.
 *
 * The LLM is the primary translator; this map is a safety net for any
 * biomarker we've seen in our sample corpus. It also provides the
 * canonical slug used to look up reference ranges.
 *
 * Keys are Spanish (and sometimes English with accents stripped), values
 * are { english, slug }. Lookup is slug-normalized so "Hemoglobina A1c"
 * and "hemoglobina a1c" resolve to the same entry.
 */
import { slugify } from "./utils";

export type DictEntry = { english: string; slug: string };

export const BIOMARKER_DICTIONARY: Record<string, DictEntry> = {
  // Spanish → English
  hematies: { english: "Red Blood Cells", slug: "red_blood_cells" },
  eritrocitos: { english: "Red Blood Cells", slug: "red_blood_cells" },
  hemoglobina: { english: "Hemoglobin", slug: "hemoglobin" },
  hematocrito: { english: "Hematocrit", slug: "hematocrit" },
  volumen_corpuscular_medio: { english: "Mean Corpuscular Volume (MCV)", slug: "mcv" },
  vcm: { english: "Mean Corpuscular Volume (MCV)", slug: "mcv" },
  hemoglobina_corpuscular_media: { english: "Mean Corpuscular Hemoglobin (MCH)", slug: "mch" },
  hcm: { english: "Mean Corpuscular Hemoglobin (MCH)", slug: "mch" },
  conc_de_hgb_corpuscular_media: {
    english: "Mean Corpuscular Hemoglobin Concentration (MCHC)",
    slug: "mchc",
  },
  chcm: { english: "Mean Corpuscular Hemoglobin Concentration (MCHC)", slug: "mchc" },
  indice_de_anisocitosis: { english: "Red Cell Distribution Width (RDW)", slug: "rdw" },
  rdw: { english: "Red Cell Distribution Width (RDW)", slug: "rdw" },
  leucocitos: { english: "White Blood Cells", slug: "white_blood_cells" },
  neutrofilos: { english: "Neutrophils (absolute)", slug: "neutrophils_abs" },
  neutrofilos_pct: { english: "Neutrophils (%)", slug: "neutrophils_pct" },
  linfocitos: { english: "Lymphocytes (absolute)", slug: "lymphocytes_abs" },
  linfocitos_pct: { english: "Lymphocytes (%)", slug: "lymphocytes_pct" },
  monocitos: { english: "Monocytes (absolute)", slug: "monocytes_abs" },
  monocitos_pct: { english: "Monocytes (%)", slug: "monocytes_pct" },
  eosinofilos: { english: "Eosinophils (absolute)", slug: "eosinophils_abs" },
  eosinofilos_pct: { english: "Eosinophils (%)", slug: "eosinophils_pct" },
  basofilos: { english: "Basophils (absolute)", slug: "basophils_abs" },
  basofilos_pct: { english: "Basophils (%)", slug: "basophils_pct" },
  plaquetas: { english: "Platelets", slug: "platelets" },
  volumen_plaquetario_medio: { english: "Mean Platelet Volume (MPV)", slug: "mpv" },
  vpm: { english: "Mean Platelet Volume (MPV)", slug: "mpv" },
  grupo_sanguineo: { english: "Blood Group (ABO)", slug: "blood_group" },
  factor_rh: { english: "Rh Factor (D)", slug: "rh_factor" },
  factor_rh_d: { english: "Rh Factor (D)", slug: "rh_factor" },

  glucosa: { english: "Glucose", slug: "glucose" },
  glucosa_suero_plasma: { english: "Glucose (serum/plasma)", slug: "glucose" },
  hemoglobina_a1c_ngsp_por_hplc: { english: "Hemoglobin A1c (NGSP)", slug: "hba1c_ngsp" },
  hemoglobina_a1c_ngsp: { english: "Hemoglobin A1c (NGSP)", slug: "hba1c_ngsp" },
  hba1c: { english: "Hemoglobin A1c (NGSP)", slug: "hba1c_ngsp" },
  hemoglobina_a1c_ifcc_por_hplc: { english: "Hemoglobin A1c (IFCC)", slug: "hba1c_ifcc" },
  hemoglobina_a1c_ifcc: { english: "Hemoglobin A1c (IFCC)", slug: "hba1c_ifcc" },

  colesterol_total: { english: "Total Cholesterol", slug: "total_cholesterol" },
  colesterol_hdl: { english: "HDL Cholesterol", slug: "hdl_cholesterol" },
  colesterol_ldl: { english: "LDL Cholesterol", slug: "ldl_cholesterol" },
  colesterol_no_hdl: { english: "Non-HDL Cholesterol", slug: "non_hdl_cholesterol" },
  trigliceridos: { english: "Triglycerides", slug: "triglycerides" },
  lipoproteina_a: { english: "Lipoprotein (a)", slug: "lipoprotein_a" },
  apolipoproteina_b: { english: "Apolipoprotein B", slug: "apolipoprotein_b" },
  apolipoproteina_a: { english: "Apolipoprotein A", slug: "apolipoprotein_a" },

  proteinas_totales: { english: "Total Protein", slug: "total_protein" },
  albumina: { english: "Albumin", slug: "albumin" },
  proteina_c_reactiva_en_suero: { english: "C-Reactive Protein (CRP)", slug: "c_reactive_protein" },
  proteina_c_reactiva: { english: "C-Reactive Protein (CRP)", slug: "c_reactive_protein" },
  pcr: { english: "C-Reactive Protein (CRP)", slug: "c_reactive_protein" },

  urato: { english: "Uric Acid", slug: "uric_acid" },
  acido_urico: { english: "Uric Acid", slug: "uric_acid" },
  creatinina: { english: "Creatinine", slug: "creatinine" },
  urea: { english: "Urea", slug: "urea" },
  nitrogeno_ureico: { english: "Blood Urea Nitrogen (BUN)", slug: "bun" },
  filtrado_glomerular: { english: "Estimated GFR (eGFR)", slug: "egfr" },
  tfg_estimada: { english: "Estimated GFR (eGFR)", slug: "egfr" },

  sodio: { english: "Sodium", slug: "sodium" },
  potasio: { english: "Potassium", slug: "potassium" },
  cloro: { english: "Chloride", slug: "chloride" },
  cloruro: { english: "Chloride", slug: "chloride" },
  calcio: { english: "Calcium", slug: "calcium" },
  magnesio: { english: "Magnesium", slug: "magnesium" },
  fosforo: { english: "Phosphorus", slug: "phosphorus" },
  hierro: { english: "Iron", slug: "iron" },
  ferritina: { english: "Ferritin", slug: "ferritin" },
  transferrina: { english: "Transferrin", slug: "transferrin" },

  tsh: { english: "TSH (Thyroid Stimulating Hormone)", slug: "tsh" },
  t4_libre: { english: "Free T4", slug: "free_t4" },
  t3_libre: { english: "Free T3", slug: "free_t3" },
  tiroxina_libre: { english: "Free T4", slug: "free_t4" },

  vitamina_d: { english: "Vitamin D (25-OH)", slug: "vitamin_d_25oh" },
  vitamina_d_25_oh: { english: "Vitamin D (25-OH)", slug: "vitamin_d_25oh" },
  vitamina_b12: { english: "Vitamin B12", slug: "vitamin_b12" },
  acido_folico: { english: "Folate (Vitamin B9)", slug: "folate" },
  folato: { english: "Folate (Vitamin B9)", slug: "folate" },

  alt: { english: "Alanine Aminotransferase (ALT)", slug: "alt" },
  gpt: { english: "Alanine Aminotransferase (ALT)", slug: "alt" },
  ast: { english: "Aspartate Aminotransferase (AST)", slug: "ast" },
  got: { english: "Aspartate Aminotransferase (AST)", slug: "ast" },
  ggt: { english: "Gamma-Glutamyl Transferase (GGT)", slug: "ggt" },
  fosfatasa_alcalina: { english: "Alkaline Phosphatase", slug: "alkaline_phosphatase" },
  bilirrubina_total: { english: "Total Bilirubin", slug: "total_bilirubin" },
  bilirrubina_directa: { english: "Direct Bilirubin", slug: "direct_bilirubin" },

  homocisteina: { english: "Homocysteine", slug: "homocysteine" },
  insulina: { english: "Insulin", slug: "insulin" },
};

/**
 * Keys sorted by length descending — used for longest-prefix matching so
 * that multi-word dictionary entries (e.g. "hemoglobina_corpuscular_media")
 * are preferred over short ones ("hemoglobina") when both could match.
 */
const DICT_KEYS_BY_LENGTH = Object.keys(BIOMARKER_DICTIONARY).sort(
  (a, b) => b.length - a.length,
);

function wordBoundaryMatch(slug: string, key: string): boolean {
  if (slug === key) return true;
  if (slug.startsWith(key + "_")) return true;
  if (slug.endsWith("_" + key)) return true;
  if (slug.includes("_" + key + "_")) return true;
  return false;
}

/**
 * Translate a biomarker name to English and return its canonical slug.
 *
 * The match strategy is:
 *   1. Exact slug match (including `_pct` suffix for percentage variants).
 *   2. Slug with trailing lab-code stripped (e.g. "..._chcm").
 *   3. Longest word-boundary prefix/suffix/infix match from the dictionary.
 *   4. Fallback: whatever the LLM/caller suggested.
 *
 * `nameOriginal` preserves percent markers such as "Neutrófilos %" so we
 * can pick the "_pct" variant — crucial for WBC differentials where the
 * absolute and percentage rows share the same base name.
 */
export function translateBiomarker(
  nameOriginal: string,
  llmEnglish: string,
  preferredSlug?: string,
): DictEntry {
  const baseKey = slugify(nameOriginal);
  const isPct =
    /\s%\s*$/.test(nameOriginal) ||
    /\(%\)\s*$/.test(nameOriginal) ||
    /%\s*$/.test(nameOriginal);
  const keys = isPct ? [baseKey + "_pct", baseKey] : [baseKey];

  for (const k of keys) {
    if (BIOMARKER_DICTIONARY[k]) return BIOMARKER_DICTIONARY[k];
  }

  const LAB_CODE_SUFFIX = /_(?:vcm|hcm|chcm|rdw|vpm|mpv|mcv|mch|mchc|hba1c|tsh|pcr|crp|ldl|hdl|vldl)$/;
  for (const k of keys) {
    const stripped = k.replace(LAB_CODE_SUFFIX, "");
    if (stripped !== k && BIOMARKER_DICTIONARY[stripped]) {
      return BIOMARKER_DICTIONARY[stripped];
    }
  }

  for (const k of keys) {
    for (const dictKey of DICT_KEYS_BY_LENGTH) {
      if (wordBoundaryMatch(k, dictKey)) return BIOMARKER_DICTIONARY[dictKey];
    }
  }

  const fallbackSlug = preferredSlug
    ? slugify(preferredSlug)
    : slugify(llmEnglish || nameOriginal);
  return {
    english: llmEnglish || nameOriginal,
    slug: fallbackSlug,
  };
}

/**
 * Normalize a biomarker's English display name into the slug our
 * reference-range table uses. Used when the LLM didn't give us a slug.
 */
export function englishToSlug(english: string): string {
  const s = slugify(english);
  const map: Record<string, string> = {
    red_blood_cells: "red_blood_cells",
    rbc: "red_blood_cells",
    hemoglobin: "hemoglobin",
    hgb: "hemoglobin",
    hb: "hemoglobin",
    hematocrit: "hematocrit",
    hct: "hematocrit",
    white_blood_cells: "white_blood_cells",
    wbc: "white_blood_cells",
    platelets: "platelets",
    plt: "platelets",
    mcv: "mcv",
    mean_corpuscular_volume: "mcv",
    mch: "mch",
    mean_corpuscular_hemoglobin: "mch",
    mchc: "mchc",
    rdw: "rdw",
    mpv: "mpv",
    glucose: "glucose",
    fasting_glucose: "glucose",
    hba1c: "hba1c_ngsp",
    hemoglobin_a1c: "hba1c_ngsp",
    hba1c_ngsp: "hba1c_ngsp",
    hba1c_ifcc: "hba1c_ifcc",
    total_cholesterol: "total_cholesterol",
    cholesterol: "total_cholesterol",
    ldl: "ldl_cholesterol",
    ldl_cholesterol: "ldl_cholesterol",
    hdl: "hdl_cholesterol",
    hdl_cholesterol: "hdl_cholesterol",
    non_hdl_cholesterol: "non_hdl_cholesterol",
    triglycerides: "triglycerides",
    tg: "triglycerides",
    lipoprotein_a: "lipoprotein_a",
    "lp_a": "lipoprotein_a",
    apolipoprotein_b: "apolipoprotein_b",
    apob: "apolipoprotein_b",
    apolipoprotein_a: "apolipoprotein_a",
    apoa: "apolipoprotein_a",
    total_protein: "total_protein",
    albumin: "albumin",
    c_reactive_protein: "c_reactive_protein",
    crp: "c_reactive_protein",
    hscrp: "c_reactive_protein",
    uric_acid: "uric_acid",
    urate: "uric_acid",
    creatinine: "creatinine",
    urea: "urea",
    bun: "bun",
    blood_urea_nitrogen: "bun",
    egfr: "egfr",
    estimated_gfr: "egfr",
    sodium: "sodium",
    na: "sodium",
    potassium: "potassium",
    k: "potassium",
    calcium: "calcium",
    ca: "calcium",
    magnesium: "magnesium",
    mg: "magnesium",
    phosphorus: "phosphorus",
    iron: "iron",
    fe: "iron",
    ferritin: "ferritin",
    transferrin: "transferrin",
    tsh: "tsh",
    free_t4: "free_t4",
    ft4: "free_t4",
    free_t3: "free_t3",
    ft3: "free_t3",
    vitamin_d: "vitamin_d_25oh",
    vitamin_d_25oh: "vitamin_d_25oh",
    "25_oh_vitamin_d": "vitamin_d_25oh",
    vitamin_b12: "vitamin_b12",
    b12: "vitamin_b12",
    folate: "folate",
    alt: "alt",
    ast: "ast",
    ggt: "ggt",
    alkaline_phosphatase: "alkaline_phosphatase",
    alp: "alkaline_phosphatase",
    total_bilirubin: "total_bilirubin",
    homocysteine: "homocysteine",
    insulin: "insulin",
    neutrophils_pct: "neutrophils_pct",
    lymphocytes_pct: "lymphocytes_pct",
    monocytes_pct: "monocytes_pct",
    eosinophils_pct: "eosinophils_pct",
    basophils_pct: "basophils_pct",
  };
  return map[s] ?? s;
}
