"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Info, Search } from "lucide-react";
import type { Biomarker, Status } from "@/lib/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

type FilterKey = "all" | Status;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "out_of_range", label: "Out of range" },
  { key: "normal", label: "Normal" },
  { key: "optimal", label: "Optimal" },
  { key: "unknown", label: "Unclassified" },
];

export function BiomarkerTable({ biomarkers }: { biomarkers: Biomarker[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return biomarkers.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.nameOriginal.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.valueText ?? "").toLowerCase().includes(q)
      );
    });
  }, [biomarkers, query, filter]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Biomarker[]>();
    for (const b of filtered) {
      const list = byCategory.get(b.category) ?? [];
      list.push(b);
      byCategory.set(b.category, list);
    }
    return Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search biomarkers…"
            className="h-9 w-56 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </header>

      {grouped.length === 0 && (
        <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No biomarkers match your filter.
        </div>
      )}

      {grouped.map(([category, items]) => (
        <div key={category} className="border-b border-slate-200 last:border-0 dark:border-slate-800">
          <button
            type="button"
            onClick={() =>
              setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-400 transition-transform",
                  collapsed[category] && "-rotate-90",
                )}
                aria-hidden
              />
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                {category}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {items.length}
              </span>
            </div>
            <CategoryCounts items={items} />
          </button>

          {!collapsed[category] && <CategoryRows items={items} />}
        </div>
      ))}
    </section>
  );
}

function CategoryCounts({ items }: { items: Biomarker[] }) {
  const counts = items.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Status, number>,
  );
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      {counts.optimal ? (
        <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/15 px-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          {counts.optimal} optimal
        </span>
      ) : null}
      {counts.out_of_range ? (
        <span className="inline-flex h-5 items-center rounded-full bg-rose-500/15 px-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
          {counts.out_of_range} out
        </span>
      ) : null}
    </div>
  );
}

function CategoryRows({ items }: { items: Biomarker[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2 font-semibold">Biomarker</th>
            <th className="px-4 py-2 text-right font-semibold">Value</th>
            <th className="px-4 py-2 font-semibold">Reference</th>
            <th className="px-4 py-2 font-semibold">Optimal</th>
            <th className="px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((b, i) => (
            <Row key={`${b.name}-${i}`} b={b} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ b }: { b: Biomarker }) {
  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {b.name}
          </span>
          {b.nameOriginal !== b.name && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {b.nameOriginal}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {b.valueText}
          </span>
          {b.unit && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {b.unit}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
          {formatRange(b.refLow, b.refHigh, b.refText)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
          {formatRange(b.optimalLow, b.optimalHigh, null)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={b.status} />
          <span
            className="inline-flex h-5 w-5 cursor-help items-center justify-center text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            title={b.statusReason}
            aria-label={b.statusReason}
            tabIndex={0}
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </td>
    </tr>
  );
}

function formatRange(
  low: number | null,
  high: number | null,
  fallback: string | null,
): string {
  if (low === null && high === null) return fallback ?? "—";
  if (low !== null && high !== null) return `${low} – ${high}`;
  if (low !== null) return `> ${low}`;
  if (high !== null) return `< ${high}`;
  return fallback ?? "—";
}
