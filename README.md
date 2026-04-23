# LabScope — PDF Lab-Report Biomarker Analyzer

**LabScope** is a small full-stack web app that takes a laboratory PDF
report (in any language), extracts every biomarker, translates names and
units into standardized English, and classifies each result as
**`optimal`**, **`normal`**, or **`out of range`** based on the patient's
age and sex as reported in the document.

The provided `docs/challenge.pdf` (a Spanish SNB Diagnósticos Globales
report) is included as `public/samples/sample-lab-report.pdf` and can be
analyzed in one click.

---

## 1. Quick start

```bash
cd labscope
npm install

# Recommended: use an LLM for robust multilingual extraction.
cp .env.example .env.local
# Then edit .env.local and add your OPENAI_API_KEY

npm run dev          # http://localhost:3000
```

Open the app and either drag-drop any lab PDF or click **Try with sample
report**. Results appear grouped by category with color-coded status and
an export button for JSON / CSV.

### Other scripts

```bash
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm test             # node --test (14 unit tests)
npm run smoke        # End-to-end pattern-extraction run on the sample PDF
```

### Running without an API key

LabScope has a built-in deterministic **pattern extractor** as a fallback.
If `OPENAI_API_KEY` is empty, the app automatically uses it. On the
included sample PDF it produces identical results to the LLM path
(36 biomarkers extracted, 3 correctly flagged out-of-range).

The pattern extractor is tuned for Spanish SNB-style reports — for
general, production-grade multilingual extraction, set the API key.

---

## 2. What it does

### Input

Any PDF lab report. Tested with the provided Spanish sample (8 pages,
~36 biomarkers across hematology, glucose, lipids, proteins, renal
function, and immunohematology).

### Output

A structured **analysis** with:

| Field | Description |
| --- | --- |
| `patient` | `{ name, sex, dateOfBirth, age, reportDate, laboratoryId, laboratoryName }`. Age is computed from DOB vs. report date. |
| `biomarkers[]` | Each: `{ name (EN), nameOriginal, valueNumeric, valueText, unit, unitOriginal, refLow, refHigh, refText, category, status, statusReason, optimalLow, optimalHigh }` |
| `summary` | Counts by status (`optimal` / `normal` / `out_of_range` / `unknown`). |
| `sourceLanguage` | ISO-639-1 code detected from the document. |
| `processedAt`, `model` | Audit metadata. |

### Classification logic

```
                      value given?
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          qualitative         quantitative
         (e.g. "A", "Rh+")        │
              │                   ▼
              │       ┌───── outside printed lab range? ────┐
              │       │                                     │
              ▼       ▼                                     ▼
           normal  out_of_range        ┌── inside curated optimal? ──┐
                                       ▼                              ▼
                                    optimal                         normal
```

- **Out of range** — strictly outside the reference range printed on the
  report (authoritative for this status).
- **Optimal** — inside our curated, age- and sex-specific *optimal*
  band from clinical guidelines (ADA 2024, ESC/EAS 2019, AACE, KDIGO,
  Mayo Clinic, NHANES, etc.). See
  [`lib/reference-ranges.ts`](lib/reference-ranges.ts) for every entry
  and its source.
- **Normal** — inside the lab reference range but outside optimal, or
  the lab range was the only signal available.
- **Unclassified** — extremely rare: no value and no parseable range.

Sex-specific rules (e.g. hemoglobin, HDL, creatinine, uric acid, iron,
ferritin) are selected by the most specific matching rule. Age-specific
rules can be added for pediatrics / geriatrics by setting `ageMin` /
`ageMax` on the rule.

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    Browser (Next.js App Router)                    │
│  Dropzone ─► /api/analyze (multipart) ─► ResultsView (table,       │
│                                          patient card, export)     │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│               Next.js Route Handler  (Node.js runtime)             │
│   app/api/analyze/route.ts                                         │
│                                                                    │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│   │  lib/pdf.ts  │──▶│  lib/ai.ts   │──▶│  lib/classify.ts      │  │
│   │  pdfjs-dist  │   │  OpenAI      │   │  reference-ranges +   │  │
│   │              │   │  structured  │   │  translation +        │  │
│   │              │   │  JSON schema │   │  optimal/normal/out   │  │
│   └──────────────┘   └──────┬───────┘   └───────────────────────┘  │
│                             │                                      │
│                             ▼ fallback                             │
│                   ┌────────────────────────┐                       │
│                   │ lib/pattern-extract.ts │                       │
│                   │  regex + dictionary    │                       │
│                   └────────────────────────┘                       │
└────────────────────────────────────────────────────────────────────┘
```

### Key design decisions

1. **Two extraction paths, one classification engine.**
   The LLM path translates / normalizes any language, but the classifier,
   unit converter, and reference-range lookup are deterministic and fully
   tested. The pattern extractor exists so the app is demo-able without an
   API key and also serves as a graceful degradation path when the LLM is
   unavailable.

2. **Structured outputs over free-form prompts.** The LLM call uses
   `response_format: { type: "json_schema", strict: true }`, so the model
   is forced to return the exact shape we parse with Zod. No regex on
   model output, no post-hoc parsing.

3. **Reference-range DB lives in code, not config.** `reference-ranges.ts`
   is a typed TypeScript module. Every entry carries a `source` string so
   clinical provenance is traceable. Age/sex-specific rules beat generic
   rules automatically via a simple specificity score.

4. **Unit conversion is rule-local.** Each optimal-range rule declares
   its canonical unit and any aliases with conversion factors. If a
   report uses `mmol/L` while our rule is in `mg/dL`, the classifier
   converts — without touching the displayed value, which stays in the
   unit reported.

5. **Translation uses a longest-match, word-boundary dictionary.** This
   fixes the classic "HCM" matching inside "CHCM" problem. See
   `lib/translate.ts`.

6. **Privacy by default.** The API handler never writes the PDF to disk
   or to storage. It holds the buffer in memory, extracts text, sends
   text (not the PDF itself) to the LLM, then drops the buffer.

### Project layout

```
app/
  layout.tsx            root layout + metadata
  page.tsx              single-page flow: upload → results
  globals.css
  api/analyze/route.ts  POST handler
components/
  Dropzone.tsx          drag-drop upload
  PatientCard.tsx       demographics summary
  StatusBadge.tsx       color pills
  StatusSummary.tsx     4-tile stats
  BiomarkerTable.tsx    grouped, searchable, filterable
  Toolbar.tsx           export + model + reset
  Logo.tsx
lib/
  pdf.ts                pdf-parse v2 wrapper (pdfjs-dist under the hood)
  ai.ts                 OpenAI structured-output client
  pattern-extract.ts    regex fallback for Spanish reports
  translate.ts          Spanish→English biomarker dictionary
  reference-ranges.ts   curated optimal ranges (age/sex-aware)
  classify.ts           status decision engine
  analyze.ts            orchestrator (ties everything together)
  schema.ts             Zod schemas / TypeScript types
  utils.ts              cn(), age/date helpers, slugify
  __tests__/            unit tests (node --test)
public/samples/         bundled sample PDF
scripts/smoke-pattern.ts end-to-end verification script
```

---

## 4. Reference data & provenance

Every optimal range has a named source. Representative examples:

| Biomarker | Rule | Source |
| --- | --- | --- |
| Hemoglobin (M) | 14 – 17 g/dL | Harrison's / NHANES |
| Hemoglobin (F) | 13 – 15.5 g/dL | Harrison's / NHANES |
| HbA1c (NGSP) | 4.5 – 5.2 % | ADA 2024 |
| LDL Cholesterol | 0 – 100 mg/dL | ESC/EAS 2019 (low-risk adults) |
| HDL (M / F) | 50 – 90 / 60 – 100 mg/dL | Framingham / ESC |
| hs-CRP | 0 – 1 mg/L | AHA |
| Creatinine (M / F) | 0.7–1.1 / 0.55–0.95 mg/dL | Mayo Clinic |
| TSH | 1 – 2.5 µIU/mL | AACE functional |
| Vitamin D (25-OH) | 40 – 70 ng/mL | Endocrine Society 2011 |

Full list and conversion factors are in
[`lib/reference-ranges.ts`](lib/reference-ranges.ts).

> **Important:** these are population-level guidelines, *not* a
> diagnosis. The UI includes a disclaimer — always consult a qualified
> clinician for medical advice.

---

## 5. Cloud deployment plan

LabScope is a standard Next.js app with a stateless Node.js API route. It
scales horizontally and has no database requirements as shipped.
Three concrete cloud patterns, from simplest to most compliance-heavy:

### A. Vercel (fastest to ship)

- **Hosting:** Vercel Next.js project. Route handler runs on serverless
  functions (configure `maxDuration: 60`, 1024 MB memory to fit pdfjs).
- **Secrets:** `OPENAI_API_KEY` in Vercel Environment Variables.
- **CDN / DDoS:** Vercel Edge Network handles this.
- **Observability:** Vercel Analytics + Sentry for errors.
- **Trade-off:** easy, but data flows via Vercel's US-east edge unless
  you pin the function region — not ideal for EU health data.

### B. AWS (EU-compliant)

- **Compute:** ECS Fargate service running the container
  (`next start -p 3000`) behind an internal ALB. Task sized 0.5 vCPU /
  1 GB. Auto-scale on RequestCount.
- **Frontend delivery:** CloudFront distribution → ALB; static assets
  served from S3 origin for lower cost and latency.
- **Secrets:** `OPENAI_API_KEY` in AWS Secrets Manager, injected at task
  startup; or a shared **AWS Bedrock** endpoint (Claude / Llama) to keep
  all processing in one AWS region and avoid cross-region LLM traffic.
- **Observability:** CloudWatch Logs + Metrics, X-Ray traces on the
  route handler, Sentry on the frontend.
- **Audit / reports (optional):** S3 bucket with KMS encryption +
  Object Lock for WORM compliance; DynamoDB for per-user history.
- **Networking:** VPC private subnets for Fargate, NAT gateway, WAF on
  CloudFront.
- **Compliance:** Sign a BAA (HIPAA) with AWS and — if retaining data —
  also with the AI vendor. For the EU sample, pin everything to
  `eu-west-1` / `eu-central-1` and use Bedrock (EU) to keep data in region.

### C. GCP

- **Compute:** Cloud Run service (container, auto-scales to zero).
  1 GiB memory, 80-concurrency, region pinned.
- **Secrets:** Secret Manager, mounted as environment variable.
- **CDN:** Cloud CDN in front of a global external HTTPS Load Balancer.
- **LLM:** Vertex AI Gemini via the OpenAI-compatible endpoint — same
  code, stays in-region.
- **Observability:** Cloud Logging + Cloud Trace + Error Reporting.

### Shared recommendations

- **Don't persist PDFs.** If you must (e.g. audit), encrypt at rest
  (KMS/Cloud KMS/Key Vault) and auto-delete after N days via lifecycle
  rules.
- **Rate-limit the API** (e.g. AWS API Gateway throttling, or
  `@upstash/ratelimit` on Vercel) to protect the LLM budget.
- **PII redaction.** For production, add a pre-LLM step that strips
  patient identifiers from the raw text before sending to the model, and
  rejoins the identifiers locally — keeps PHI out of third-party logs.
- **Data residency.** EU source PDFs should use EU-hosted LLMs (Azure
  OpenAI EU, Bedrock EU, Vertex AI EU, or a self-hosted model).

---

## 6. Limitations & next steps

- **Scanned PDFs.** LabScope does text-layer extraction only. A scanned
  (image-only) PDF needs an OCR pass first (Tesseract, AWS Textract,
  Google Document AI). The current error message tells the user so.
- **Reference DB coverage.** ~45 biomarkers have curated optimal ranges.
  Markers outside that set still get `normal` / `out_of_range` from the
  lab's own reference range — the LLM fills the gap for obscure panels.
- **Age bands.** Only one age-specific rule is in the table today
  (placeholder). Adding pediatrics / geriatrics is a pure data change.
- **Test coverage.** 14 unit tests on the classifier. A browser-level
  E2E (Playwright) would be the next layer.
- **Internationalization of the UI.** The UI is English only. The data
  layer is fully multilingual.

---

## 7. Tech stack

- **Next.js 16** (App Router, Node.js runtime for the API route)
- **TypeScript** (strict, ES2022)
- **Tailwind CSS v4** + **lucide-react** icons
- **react-dropzone** for upload UX
- **pdf-parse v2** (wraps Mozilla `pdfjs-dist`, no native deps)
- **openai** SDK with JSON-schema structured outputs
- **zod** for runtime validation
- **node --test** + **tsx** for unit tests

---

## 8. File checklist for review

The pieces most worth looking at:

1. [`lib/classify.ts`](lib/classify.ts) — the decision engine.
2. [`lib/reference-ranges.ts`](lib/reference-ranges.ts) — the curated DB.
3. [`lib/ai.ts`](lib/ai.ts) — the LLM prompt and JSON schema.
4. [`lib/pattern-extract.ts`](lib/pattern-extract.ts) — the no-API-key path.
5. [`lib/__tests__/classify.test.ts`](lib/__tests__/classify.test.ts) — the tests.
6. [`app/api/analyze/route.ts`](app/api/analyze/route.ts) — input validation and orchestration.
7. [`components/BiomarkerTable.tsx`](components/BiomarkerTable.tsx) — the main results UI.
