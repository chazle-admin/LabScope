import type { Analysis, LlmExtraction, Patient } from "./schema";
import { classifyBiomarker, deriveSex, summarize } from "./classify";
import { extractPdfText } from "./pdf";
import { extractWithLLM } from "./ai";
import { patternExtract } from "./pattern-extract";
import { calculateAge } from "./utils";

export type AnalyzeOptions = {
  /**
   * Force a specific extraction engine. Defaults to "auto":
   *  - auto: LLM if OPENAI_API_KEY is set, else pattern-extract
   *  - llm:  LLM always (errors if no key)
   *  - pattern: Always use the regex fallback (useful for tests / demos)
   */
  engine?: "auto" | "llm" | "pattern";
  model?: string;
};

export type AnalyzeResult = {
  analysis: Analysis;
  rawText: string;
  engine: "llm" | "pattern";
  warnings: string[];
};

export async function analyzePdf(
  buffer: Buffer,
  opts: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const { text, numPages } = await extractPdfText(buffer);
  if (!text) {
    throw new Error("Could not extract any text from the PDF. It may be a scanned image.");
  }

  const engine = opts.engine ?? "auto";
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const useLLM = engine === "llm" || (engine === "auto" && hasKey);

  const warnings: string[] = [];
  let extraction: LlmExtraction;
  let model: string;
  let resolvedEngine: "llm" | "pattern";

  if (useLLM) {
    try {
      const result = await extractWithLLM(text, { model: opts.model });
      extraction = result.extraction;
      model = result.model;
      resolvedEngine = "llm";
    } catch (err) {
      if (engine === "llm") throw err;
      warnings.push(
        `LLM extraction failed, using pattern fallback. Reason: ${(err as Error).message}`,
      );
      extraction = patternExtract(text);
      model = "pattern-extract";
      resolvedEngine = "pattern";
    }
  } else {
    if (engine === "auto") {
      warnings.push(
        "OPENAI_API_KEY is not set — using built-in pattern extractor. Accuracy is limited to reports matching the known template.",
      );
    }
    extraction = patternExtract(text);
    model = "pattern-extract";
    resolvedEngine = "pattern";
  }

  const patient: Patient = {
    name: extraction.patient.name,
    sex: deriveSex(extraction.patient.sex),
    dateOfBirth: extraction.patient.dateOfBirth,
    age: calculateAge(extraction.patient.dateOfBirth, extraction.patient.reportDate ?? undefined),
    reportDate: extraction.patient.reportDate,
    laboratoryId: extraction.patient.laboratoryId,
    laboratoryName: extraction.patient.laboratoryName,
  };

  if (patient.sex === "unknown") {
    warnings.push(
      "Patient sex could not be determined from the report. Sex-specific reference ranges are not applied.",
    );
  }
  if (patient.age === null) {
    warnings.push(
      "Patient age could not be determined. Age-specific reference ranges are not applied.",
    );
  }

  const biomarkers = extraction.biomarkers
    .map((raw) => classifyBiomarker(raw, patient))
    .sort((a, b) => {
      const ca = a.category.localeCompare(b.category);
      if (ca !== 0) return ca;
      return a.name.localeCompare(b.name);
    });

  const analysis: Analysis = {
    patient,
    biomarkers,
    summary: summarize(biomarkers),
    sourceLanguage: extraction.sourceLanguage ?? null,
    processedAt: new Date().toISOString(),
    model,
  };

  if (numPages > 0 && biomarkers.length === 0) {
    warnings.push(
      `Extracted ${numPages} page(s) of text but no biomarkers were identified. The report may be in an unsupported format.`,
    );
  }

  return { analysis, rawText: text, engine: resolvedEngine, warnings };
}
