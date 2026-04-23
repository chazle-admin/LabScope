"use client";

import { Download, RefreshCw } from "lucide-react";
import type { Analysis } from "@/lib/schema";

export function Toolbar({
  analysis,
  engine,
  onReset,
}: {
  analysis: Analysis;
  engine: "llm" | "pattern";
  onReset: () => void;
}) {
  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    download(
      "biomarkers.json",
      JSON.stringify(analysis, null, 2),
      "application/json",
    );
  };

  const downloadCsv = () => {
    const header = [
      "Category",
      "Biomarker (EN)",
      "Biomarker (Original)",
      "Value",
      "Unit",
      "Reference",
      "Optimal",
      "Status",
      "Reason",
    ];
    const rows = analysis.biomarkers.map((b) => [
      b.category,
      b.name,
      b.nameOriginal,
      b.valueText,
      b.unit ?? "",
      formatRange(b.refLow, b.refHigh, b.refText),
      formatRange(b.optimalLow, b.optimalHigh, null),
      b.status,
      b.statusReason,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");
    download("biomarkers.csv", csv, "text/csv");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span
            className={
              engine === "llm"
                ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                : "h-1.5 w-1.5 rounded-full bg-amber-500"
            }
            aria-hidden
          />
          {engine === "llm" ? analysis.model : "Pattern extractor"}
        </span>
        {analysis.sourceLanguage && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {analysis.sourceLanguage.toUpperCase()}
          </span>
        )}
        <span className="hidden sm:inline">
          Processed {new Date(analysis.processedAt).toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={downloadCsv}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <button
          type="button"
          onClick={downloadJson}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" /> JSON
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Analyze another
        </button>
      </div>
    </div>
  );
}

function escapeCsv(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatRange(
  low: number | null,
  high: number | null,
  fallback: string | null,
): string {
  if (low === null && high === null) return fallback ?? "";
  if (low !== null && high !== null) return `${low} – ${high}`;
  if (low !== null) return `> ${low}`;
  if (high !== null) return `< ${high}`;
  return fallback ?? "";
}
