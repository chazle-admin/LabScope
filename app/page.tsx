"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FlaskConical, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Dropzone } from "@/components/Dropzone";
import { PatientCard } from "@/components/PatientCard";
import { StatusSummary } from "@/components/StatusSummary";
import { BiomarkerTable } from "@/components/BiomarkerTable";
import { Toolbar } from "@/components/Toolbar";
import type { Analysis } from "@/lib/schema";

type ApiSuccess = {
  ok: true;
  engine: "llm" | "pattern";
  warnings: string[];
  analysis: Analysis;
};
type ApiError = { ok: false; error: string };
type ApiResponse = ApiSuccess | ApiError;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("engine", "auto");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = (await res.json()) as ApiResponse;
      if (!data.ok) {
        throw new Error(data.error || "Analysis failed");
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/samples/sample-lab-report.pdf");
      if (!res.ok) throw new Error("Could not load sample PDF");
      const blob = await res.blob();
      const file = new File([blob], "sample-lab-report.pdf", { type: "application/pdf" });
      await upload(file);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, [upload]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Logo />
        <Link
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-xs font-medium text-slate-500 hover:text-slate-700 sm:inline dark:hover:text-slate-200"
        >
          v0.1 · PDF → Structured Biomarkers
        </Link>
      </header>

      {!result ? (
        <main className="mt-12 flex flex-col items-center">
          <div className="max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5" /> Multilingual · Age & sex aware
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
              Understand any lab report,{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-sky-600 bg-clip-text text-transparent">
                in seconds.
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Upload a PDF, we extract every biomarker, translate names and units into
              standard English, and classify each result as{" "}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">optimal</span>,{" "}
              <span className="font-medium text-sky-600 dark:text-sky-400">normal</span>, or{" "}
              <span className="font-medium text-rose-600 dark:text-rose-400">out of range</span>{" "}
              using clinical reference ranges adjusted for the patient&apos;s age and sex.
            </p>
          </div>

          <div className="mt-10 w-full max-w-2xl">
            <Dropzone
              onFile={upload}
              disabled={loading}
              error={error}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Files never leave your local environment. No data is stored.</span>
              <button
                type="button"
                onClick={loadSample}
                disabled={loading}
                className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline disabled:opacity-50 dark:text-emerald-400"
              >
                <FlaskConical className="h-3.5 w-3.5" /> Try with sample report
              </button>
            </div>

            {loading && (
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                Extracting biomarkers…
              </div>
            )}
          </div>

          <Features />
        </main>
      ) : (
        <main className="mt-8 flex flex-col gap-6">
          <Toolbar analysis={result.analysis} engine={result.engine} onReset={reset} />

          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Notes
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <PatientCard patient={result.analysis.patient} />
          <StatusSummary summary={result.analysis.summary} />
          <BiomarkerTable biomarkers={result.analysis.biomarkers} />

          <footer className="pt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Classification is informational, based on published clinical guidelines. It
            is not a diagnosis — always consult a qualified clinician for medical advice.
          </footer>
        </main>
      )}
    </div>
  );
}

function Features() {
  const items = [
    {
      title: "Multilingual extraction",
      body: "Spanish, English, French, German and more. The AI translates every biomarker name and unit into standardized English.",
    },
    {
      title: "Age & sex–aware",
      body: "Reference ranges are matched to the patient demographics parsed from the report, so the status reflects the right baseline.",
    },
    {
      title: "Three-tier classification",
      body: "Optimal (curated longevity ranges), Normal (within the lab's reference), or Out of range — each with a human-readable reason.",
    },
  ];
  return (
    <section
      aria-label="Features"
      className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {items.map((it) => (
        <article
          key={it.title}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {it.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {it.body}
          </p>
        </article>
      ))}
    </section>
  );
}
