import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-600 shadow-sm shadow-emerald-500/30">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          aria-hidden
        >
          <path
            d="M7 3h10a1 1 0 0 1 1 1v4.4a3 3 0 0 1-.55 1.73l-3.12 4.56a3 3 0 0 0-.53 1.7V20a1 1 0 0 1-1 1h-3.6a1 1 0 0 1-1-1v-3.6a3 3 0 0 0-.53-1.7l-3.12-4.57A3 3 0 0 1 6 8.4V4a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="15.5" r="0.9" fill="currentColor" />
          <circle cx="12.5" cy="17" r="0.7" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          LabScope
        </span>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Biomarker Analyzer
        </span>
      </div>
    </div>
  );
}
