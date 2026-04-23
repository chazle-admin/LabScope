import { PDFParse } from "pdf-parse";

/**
 * Extract plain text from a PDF buffer. We use `pdf-parse` v2 which
 * wraps Mozilla's `pdfjs-dist` under the hood — no native deps.
 *
 * The returned text preserves line breaks so downstream row-matching
 * (e.g. in the LLM prompt) can still group tokens by line when useful.
 */
export async function extractPdfText(buffer: Buffer | Uint8Array): Promise<{
  text: string;
  numPages: number;
}> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  await parser.destroy().catch(() => {});
  return {
    text: (result.text ?? "").trim(),
    numPages: result.total ?? 0,
  };
}
