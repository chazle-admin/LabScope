import { UserRound } from "lucide-react";
import type { Patient } from "@/lib/schema";
import { formatDate } from "@/lib/utils";

const SEX_LABEL: Record<Patient["sex"], string> = {
  male: "Male",
  female: "Female",
  unknown: "Unknown",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {value ?? <span className="text-slate-400">—</span>}
      </span>
    </div>
  );
}

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <section
      aria-label="Patient information"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {patient.name || "Patient"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {patient.laboratoryName ||
                patient.laboratoryId ||
                "Lab report"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Sex" value={SEX_LABEL[patient.sex]} />
        <Field
          label="Age"
          value={patient.age !== null ? `${patient.age} years` : null}
        />
        <Field label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
        <Field label="Report Date" value={formatDate(patient.reportDate)} />
      </div>
    </section>
  );
}
