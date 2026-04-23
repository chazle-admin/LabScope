"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dropzone({
  onFile,
  disabled,
  error,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const [filename, setFilename] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      setFilename(f.name);
      onFile(f);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 text-center transition-all",
        "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/70",
        "dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600 dark:hover:bg-slate-900/80",
        isDragActive &&
          "border-emerald-500 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/5",
        isDragReject && "border-rose-400 bg-rose-50 dark:bg-rose-500/5",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && "cursor-pointer",
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
          isDragActive && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
        )}
      >
        {filename ? <FileText className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
      </div>

      {filename ? (
        <>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {filename}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click or drag another PDF to replace
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isDragActive ? "Drop the PDF here" : "Drag & drop your lab report"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            or{" "}
            <span className="text-emerald-700 underline underline-offset-2 dark:text-emerald-400">
              click to browse
            </span>{" "}
            · PDF up to 10 MB
          </p>
        </>
      )}

      {error && (
        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
