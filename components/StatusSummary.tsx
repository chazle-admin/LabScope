import type { Analysis } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleAlert, CircleHelp, Gauge } from "lucide-react";

const TILES = [
  {
    key: "optimal",
    label: "Optimal",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    iconClassName: "text-emerald-500",
  },
  {
    key: "normal",
    label: "Normal",
    icon: Gauge,
    className:
      "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-400/20",
    iconClassName: "text-sky-500",
  },
  {
    key: "outOfRange",
    label: "Out of range",
    icon: CircleAlert,
    className:
      "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20",
    iconClassName: "text-rose-500",
  },
  {
    key: "unknown",
    label: "Unclassified",
    icon: CircleHelp,
    className:
      "bg-slate-50 text-slate-700 ring-slate-500/15 dark:bg-slate-500/10 dark:text-slate-200 dark:ring-slate-400/20",
    iconClassName: "text-slate-500",
  },
] as const;

export function StatusSummary({ summary }: { summary: Analysis["summary"] }) {
  return (
    <section
      aria-label="Results summary"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {TILES.map(({ key, label, icon: Icon, className, iconClassName }) => (
        <div
          key={key}
          className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3 ring-1 ring-inset",
            className,
          )}
        >
          <div className="flex flex-col">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] opacity-75">
              {label}
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {summary[key]}
            </span>
          </div>
          <Icon className={cn("h-5 w-5", iconClassName)} aria-hidden />
        </div>
      ))}
    </section>
  );
}
