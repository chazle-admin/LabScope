import { z } from "zod";

/** Biological sex as reported / inferred. Used for sex-specific reference ranges. */
export const SexSchema = z.enum(["male", "female", "unknown"]);
export type Sex = z.infer<typeof SexSchema>;

/** Final classification of a single biomarker result. */
export const StatusSchema = z.enum(["optimal", "normal", "out_of_range", "unknown"]);
export type Status = z.infer<typeof StatusSchema>;

/**
 * A single biomarker extracted from the report.
 * `valueNumeric` is the parsed number when the value is a clean decimal;
 * `valueText` preserves the original textual value (e.g. "Positivo", "<0.2", "A").
 */
export const BiomarkerSchema = z.object({
  name: z.string(),
  nameOriginal: z.string(),
  valueNumeric: z.number().nullable(),
  valueText: z.string(),
  unit: z.string().nullable(),
  unitOriginal: z.string().nullable(),
  refLow: z.number().nullable(),
  refHigh: z.number().nullable(),
  refText: z.string().nullable(),
  category: z.string(),
  status: StatusSchema,
  statusReason: z.string(),
  optimalLow: z.number().nullable(),
  optimalHigh: z.number().nullable(),
  notes: z.string().nullable(),
});
export type Biomarker = z.infer<typeof BiomarkerSchema>;

export const PatientSchema = z.object({
  name: z.string().nullable(),
  sex: SexSchema,
  dateOfBirth: z.string().nullable(),
  age: z.number().int().nullable(),
  reportDate: z.string().nullable(),
  laboratoryId: z.string().nullable(),
  laboratoryName: z.string().nullable(),
});
export type Patient = z.infer<typeof PatientSchema>;

export const AnalysisSchema = z.object({
  patient: PatientSchema,
  biomarkers: z.array(BiomarkerSchema),
  summary: z.object({
    total: z.number().int(),
    optimal: z.number().int(),
    normal: z.number().int(),
    outOfRange: z.number().int(),
    unknown: z.number().int(),
  }),
  sourceLanguage: z.string().nullable(),
  processedAt: z.string(),
  model: z.string(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/**
 * Raw structure returned by the LLM before enrichment/classification.
 * Kept deliberately loose so the UI layer never receives junk.
 */
export const LlmBiomarkerSchema = z.object({
  nameOriginal: z.string(),
  nameEnglish: z.string(),
  valueNumeric: z.number().nullable(),
  valueText: z.string(),
  unitOriginal: z.string().nullable(),
  unitEnglish: z.string().nullable(),
  refLow: z.number().nullable(),
  refHigh: z.number().nullable(),
  refText: z.string().nullable(),
  category: z.string(),
  notes: z.string().nullable(),
});
export type LlmBiomarker = z.infer<typeof LlmBiomarkerSchema>;

export const LlmExtractionSchema = z.object({
  patient: z.object({
    name: z.string().nullable(),
    sex: z.enum(["male", "female", "unknown"]),
    dateOfBirth: z.string().nullable(),
    reportDate: z.string().nullable(),
    laboratoryName: z.string().nullable(),
    laboratoryId: z.string().nullable(),
  }),
  sourceLanguage: z.string().nullable(),
  biomarkers: z.array(LlmBiomarkerSchema),
});
export type LlmExtraction = z.infer<typeof LlmExtractionSchema>;
