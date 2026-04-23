import { cn } from "@/lib/utils";
import type { Status } from "@/lib/schema";

const STYLES: Record<Status, { label: string; className: string; dot: string }> = {
  optimal: {
    label: "Optimal",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
    dot: "bg-emerald-500",
  },
  normal: {
    label: "Normal",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30",
    dot: "bg-sky-500",
  },
  out_of_range: {
    label: "Out of range",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30",
    dot: "bg-rose-500",
  },
  unknown: {
    label: "Unclassified",
    className: "bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: Status;
  size?: "sm" | "md";
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        s.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}
