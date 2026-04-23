import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";
import { patternExtract } from "../lib/pattern-extract";
import { analyzePdf } from "../lib/analyze";

const buf = readFileSync("public/samples/sample-lab-report.pdf");

(async () => {
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const res = await parser.getText();
  await parser.destroy().catch(() => {});
  console.log("=== Extracted text (first 40 lines) ===");
  console.log(res.text.split("\n").slice(0, 40).join("\n"));
  console.log("... (truncated)");
  console.log();

  console.log("=== Pattern extraction (no API key) ===");
  const p = patternExtract(res.text);
  console.log("Patient:", p.patient);
  console.log("Biomarkers:", p.biomarkers.length);
  for (const b of p.biomarkers) {
    console.log(
      `  • [${b.category}] ${b.nameEnglish.padEnd(44)} ${String(b.valueText).padStart(8)} ${String(b.unitOriginal ?? "").padEnd(10)} ref=${b.refLow ?? "—"}..${b.refHigh ?? "—"}`,
    );
  }
  console.log();

  console.log("=== Full analyzePdf(engine=pattern) ===");
  const a = await analyzePdf(buf, { engine: "pattern" });
  console.log("Engine:", a.engine);
  console.log("Warnings:", a.warnings);
  console.log("Patient:", a.analysis.patient);
  console.log("Summary:", a.analysis.summary);
  console.log("Classified biomarkers:");
  for (const b of a.analysis.biomarkers) {
    console.log(
      `  [${b.status.toUpperCase().padEnd(12)}] ${b.name.padEnd(44)} ${String(b.valueText).padStart(8)} ${String(b.unit ?? "").padEnd(10)}  reason: ${b.statusReason}`,
    );
  }
})();
