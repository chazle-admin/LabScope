import { NextResponse, type NextRequest } from "next/server";
import { analyzePdf } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data upload" },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const engine = (form.get("engine") as string | null) ?? "auto";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 10 MB.` },
        { status: 413 },
      );
    }
    if (
      file.type &&
      !["application/pdf", "application/octet-stream"].includes(file.type) &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please upload a PDF.` },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const normalizedEngine =
      engine === "llm" || engine === "pattern" || engine === "auto" ? engine : "auto";

    const result = await analyzePdf(buffer, { engine: normalizedEngine });

    return NextResponse.json({
      ok: true,
      engine: result.engine,
      warnings: result.warnings,
      analysis: result.analysis,
    });
  } catch (err) {
    console.error("[api/analyze] error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
