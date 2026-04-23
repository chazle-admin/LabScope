import OpenAI from "openai";
import { LlmExtractionSchema, type LlmExtraction } from "./schema";

const SYSTEM_PROMPT = `You are a clinical data extraction engine. You receive the raw text of a laboratory report (in any language) and return a strictly-typed JSON representation.

Rules:
1. Translate every biomarker name into standard, idiomatic English (e.g. "Hematíes" -> "Red Blood Cells", "Urato" -> "Uric Acid"). Preserve the ORIGINAL name in nameOriginal.
2. Standardize units using the conventional clinical abbreviation (g/dL, mg/dL, mmol/L, umol/L, ug/dL, ng/mL, pg/mL, U/L, uIU/mL, 10^3/uL, 10^6/uL, %, fL, pg, mIU/L, mmol/mol, etc.). Preserve the original unit string in unitOriginal.
3. Parse numeric value when possible, into valueNumeric. Always populate valueText with the original textual value (e.g. "4,73", "<0.2", "Positivo", "A").
4. If a numeric reference range is given (e.g. "[ 74 - 106 ]"), set refLow=74, refHigh=106. For "< 5", set refLow=null, refHigh=5. For "> 40", set refLow=40, refHigh=null. ALWAYS copy the raw range text into refText.
5. Group biomarkers into a concise category in English: "Hematology", "Glucose metabolism", "Lipid panel", "Proteins / Inflammation", "Renal function", "Liver function", "Thyroid", "Vitamins", "Minerals / Electrolytes", "Immunohematology", or "Other".
6. Do NOT invent biomarkers that are not in the report. Do NOT skip ones that are. Capture qualitative results too (e.g. ABO blood group "A", Rh "Positivo" -> valueText="Positive").
7. For patient: extract sex ("male" | "female" | "unknown"), dateOfBirth (ISO YYYY-MM-DD if possible, else the original string), reportDate (ISO), laboratoryName, laboratoryId. Infer sex from Spanish/French/German/etc. words ("Hombre"=male, "Mujer"=female, "Homme"=male, "Femme"=female, etc.).
8. sourceLanguage is the ISO-639-1 code of the report's primary language ("es", "en", "fr", "de", "it", etc.).
9. Never include markdown, prose, or code fences — only the JSON.
10. European number formats may use commas (4,73 means 4.73); convert to decimal dots in valueNumeric.`;

const JSON_SCHEMA = {
  name: "lab_report_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["patient", "sourceLanguage", "biomarkers"],
    properties: {
      patient: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "sex",
          "dateOfBirth",
          "reportDate",
          "laboratoryName",
          "laboratoryId",
        ],
        properties: {
          name: { type: ["string", "null"] },
          sex: { type: "string", enum: ["male", "female", "unknown"] },
          dateOfBirth: { type: ["string", "null"] },
          reportDate: { type: ["string", "null"] },
          laboratoryName: { type: ["string", "null"] },
          laboratoryId: { type: ["string", "null"] },
        },
      },
      sourceLanguage: { type: ["string", "null"] },
      biomarkers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "nameOriginal",
            "nameEnglish",
            "valueNumeric",
            "valueText",
            "unitOriginal",
            "unitEnglish",
            "refLow",
            "refHigh",
            "refText",
            "category",
            "notes",
          ],
          properties: {
            nameOriginal: { type: "string" },
            nameEnglish: { type: "string" },
            valueNumeric: { type: ["number", "null"] },
            valueText: { type: "string" },
            unitOriginal: { type: ["string", "null"] },
            unitEnglish: { type: ["string", "null"] },
            refLow: { type: ["number", "null"] },
            refHigh: { type: ["number", "null"] },
            refText: { type: ["string", "null"] },
            category: { type: "string" },
            notes: { type: ["string", "null"] },
          },
        },
      },
    },
  },
} as const;

export type ExtractionOptions = {
  model?: string;
  apiKey?: string;
  baseURL?: string;
};

export async function extractWithLLM(
  pdfText: string,
  opts: ExtractionOptions = {},
): Promise<{ extraction: LlmExtraction; model: string }> {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Configure it in .env.local or fall back to pattern extraction.",
    );
  }

  const model = opts.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey, baseURL: opts.baseURL });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract every biomarker from this laboratory report. Return ONLY the JSON object defined by the schema.\n\n--- REPORT START ---\n${pdfText}\n--- REPORT END ---`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: JSON_SCHEMA,
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("LLM returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`LLM returned invalid JSON: ${(e as Error).message}`);
  }
  const validated = LlmExtractionSchema.parse(parsed);
  return { extraction: validated, model };
}
