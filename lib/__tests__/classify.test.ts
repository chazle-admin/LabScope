import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyBiomarker,
  deriveSex,
  parseReferenceText,
  summarize,
} from "../classify";
import type { LlmBiomarker, Patient } from "../schema";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    name: null,
    sex: "male",
    dateOfBirth: "1978-02-13",
    age: 48,
    reportDate: "2026-02-23",
    laboratoryId: null,
    laboratoryName: null,
    ...overrides,
  };
}

function biomarker(overrides: Partial<LlmBiomarker> = {}): LlmBiomarker {
  return {
    nameOriginal: "Glucosa (suero/plasma)",
    nameEnglish: "Glucose",
    valueNumeric: 99,
    valueText: "99",
    unitOriginal: "mg/dL",
    unitEnglish: "mg/dL",
    refLow: 74,
    refHigh: 106,
    refText: "74 - 106",
    category: "Glucose metabolism",
    notes: null,
    ...overrides,
  };
}

describe("parseReferenceText", () => {
  it("parses two-sided ranges", () => {
    assert.deepEqual(parseReferenceText("[ 74 - 106 ]"), { low: 74, high: 106 });
    assert.deepEqual(parseReferenceText("74 – 106"), { low: 74, high: 106 });
    assert.deepEqual(parseReferenceText("3.6 - 7.7"), { low: 3.6, high: 7.7 });
  });

  it("parses one-sided ranges", () => {
    assert.deepEqual(parseReferenceText("< 5,7"), { low: null, high: 5.7 });
    assert.deepEqual(parseReferenceText("> 40"), { low: 40, high: null });
    assert.deepEqual(parseReferenceText("< 200"), { low: null, high: 200 });
  });

  it("returns nulls for unparseable text", () => {
    assert.deepEqual(parseReferenceText(""), { low: null, high: null });
    assert.deepEqual(parseReferenceText(null), { low: null, high: null });
    assert.deepEqual(parseReferenceText("Positive"), { low: null, high: null });
  });
});

describe("deriveSex", () => {
  it("maps common Spanish/English variants", () => {
    assert.equal(deriveSex("Hombre"), "male");
    assert.equal(deriveSex("HOMBRE"), "male");
    assert.equal(deriveSex("mujer"), "female");
    assert.equal(deriveSex("Male"), "male");
    assert.equal(deriveSex("F"), "female");
    assert.equal(deriveSex(""), "unknown");
    assert.equal(deriveSex(null), "unknown");
  });
});

describe("classifyBiomarker", () => {
  it("returns 'optimal' when value is inside both lab range and curated optimal", () => {
    const b = classifyBiomarker(
      biomarker({
        nameOriginal: "Urato",
        nameEnglish: "Uric Acid",
        valueNumeric: 4.2,
        refLow: 3.6,
        refHigh: 7.7,
        unitOriginal: "mg/dL",
      }),
      patient(),
    );
    assert.equal(b.status, "optimal");
  });

  it("returns 'normal' when value is inside lab range but outside optimal", () => {
    const b = classifyBiomarker(
      biomarker({ valueNumeric: 99, refLow: 74, refHigh: 106 }),
      patient(),
    );
    assert.equal(b.status, "normal");
    assert.ok(b.statusReason.includes("optimal range"));
  });

  it("returns 'out_of_range' when value exceeds the printed high limit", () => {
    const b = classifyBiomarker(
      biomarker({
        nameOriginal: "Colesterol total",
        nameEnglish: "Total Cholesterol",
        valueNumeric: 209,
        refLow: null,
        refHigh: 200,
        refText: "< 200",
      }),
      patient(),
    );
    assert.equal(b.status, "out_of_range");
  });

  it("returns 'out_of_range' for LDL above lab limit", () => {
    const b = classifyBiomarker(
      biomarker({
        nameOriginal: "Colesterol LDL",
        nameEnglish: "LDL Cholesterol",
        valueNumeric: 149,
        refLow: null,
        refHigh: 116,
        refText: "< 116",
      }),
      patient(),
    );
    assert.equal(b.status, "out_of_range");
    assert.equal(b.name, "LDL Cholesterol");
  });

  it("treats qualitative results as 'normal'", () => {
    const b = classifyBiomarker(
      biomarker({
        nameOriginal: "Grupo sanguíneo",
        nameEnglish: "Blood Group (ABO)",
        valueNumeric: null,
        valueText: "A",
        unitOriginal: null,
        unitEnglish: null,
        refLow: null,
        refHigh: null,
        refText: null,
      }),
      patient(),
    );
    assert.equal(b.status, "normal");
    assert.ok(b.statusReason.includes("Qualitative"));
  });

  it("applies sex-specific optimal ranges (HDL, male=49 should be 'normal')", () => {
    const male = classifyBiomarker(
      biomarker({
        nameOriginal: "Colesterol HDL",
        nameEnglish: "HDL Cholesterol",
        valueNumeric: 49,
        refLow: 40,
        refHigh: null,
        refText: "> 40",
      }),
      patient({ sex: "male" }),
    );
    assert.equal(male.status, "normal");
    assert.equal(male.optimalLow, 50);

    const female = classifyBiomarker(
      biomarker({
        nameOriginal: "Colesterol HDL",
        nameEnglish: "HDL Cholesterol",
        valueNumeric: 49,
        refLow: 40,
        refHigh: null,
        refText: "> 40",
      }),
      patient({ sex: "female" }),
    );
    assert.equal(female.optimalLow, 60);
  });

  it("distinguishes Neutrophils (%) from Neutrophils absolute", () => {
    const pct = classifyBiomarker(
      biomarker({
        nameOriginal: "Neutrófilos %",
        nameEnglish: "Neutrophils %",
        valueNumeric: 50.8,
        unitOriginal: "%",
        refLow: 42,
        refHigh: 77,
      }),
      patient(),
    );
    assert.equal(pct.name, "Neutrophils (%)");
    assert.equal(pct.status, "optimal");

    const abs = classifyBiomarker(
      biomarker({
        nameOriginal: "Neutrófilos",
        nameEnglish: "Neutrophils",
        valueNumeric: 2.2,
        unitOriginal: "x10³/mm³",
        refLow: 1.5,
        refHigh: 7.7,
      }),
      patient(),
    );
    assert.equal(abs.name, "Neutrophils (absolute)");
    assert.equal(abs.status, "normal");
  });

  it("maps MCH / MCHC / MCV correctly by name (no substring collision)", () => {
    const mch = classifyBiomarker(
      biomarker({
        nameOriginal: "Hemoglobina corpuscular media (HCM)",
        nameEnglish: "Mean Corpuscular Hemoglobin",
        valueNumeric: 29.5,
        unitOriginal: "pg",
        refLow: 26,
        refHigh: 33.5,
      }),
      patient(),
    );
    assert.equal(mch.name, "Mean Corpuscular Hemoglobin (MCH)");
    assert.equal(mch.optimalLow, 28);
    assert.equal(mch.optimalHigh, 32);

    const mchc = classifyBiomarker(
      biomarker({
        nameOriginal: "Conc. de hgb. corpuscular media (CHCM)",
        nameEnglish: "Mean Corpuscular Hemoglobin Concentration",
        valueNumeric: 32.7,
        unitOriginal: "g/dL",
        refLow: 31.5,
        refHigh: 36,
      }),
      patient(),
    );
    assert.equal(mchc.name, "Mean Corpuscular Hemoglobin Concentration (MCHC)");
    assert.equal(mchc.optimalLow, 33);
    assert.equal(mchc.optimalHigh, 35);
  });

  it("handles values given as text inequality ('<0,2 mg/L')", () => {
    const b = classifyBiomarker(
      biomarker({
        nameOriginal: "Proteína C Reactiva en suero",
        nameEnglish: "C-Reactive Protein (CRP)",
        valueNumeric: 0.2,
        valueText: "<0,2",
        unitOriginal: "mg/L",
        refLow: null,
        refHigh: 5,
        refText: "< 5",
      }),
      patient(),
    );
    assert.equal(b.status, "optimal");
  });
});

describe("summarize", () => {
  it("counts statuses correctly", () => {
    const base = biomarker({ valueNumeric: 100, refLow: 0, refHigh: 200 });
    const items = [
      classifyBiomarker({ ...base }, patient()),
      classifyBiomarker(
        {
          ...base,
          nameOriginal: "Colesterol total",
          nameEnglish: "Total Cholesterol",
          valueNumeric: 300,
          refLow: null,
          refHigh: 200,
          refText: "< 200",
        },
        patient(),
      ),
    ];
    const s = summarize(items);
    assert.equal(s.total, 2);
    assert.equal(s.outOfRange, 1);
  });
});
