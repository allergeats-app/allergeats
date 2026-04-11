/**
 * lib/menu-ingestion/adapters/pdfAdapter.ts
 *
 * PDF menu adapter — extracts text from PDF files and parses them
 * using the same logic as UserUploadAdapter.
 *
 * Works for: restaurant PDF menus, printable menu PDFs, allergen PDFs.
 * Confidence: MEDIUM — layout artifacts are possible in multi-column PDFs,
 * but text-heavy menus (most restaurant PDFs) parse cleanly.
 *
 * Server-side only — uses pdf-parse (Node.js).
 */

import type { MenuIngestionAdapter, NormalizedMenu, IngestionMeta } from "../types";
import { UserUploadAdapter } from "./userUploadAdapter";

// Lazy-load pdf-parse so it never touches client bundles
// (it uses Node.js fs/path internally)
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Use lib path to skip pdf-parse's built-in test-file import (known v1 issue)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse") as (
    buf: Buffer,
    opts?: { max?: number }
  ) => Promise<{ text: string; numpages: number }>;

  const { text } = await pdfParse(buffer, { max: 30 }); // cap at 30 pages
  return text;
}

/**
 * Clean PDF-extracted text before handing to the menu parser:
 * - Collapse runs of 3+ spaces (multi-column layout artifact)
 * - Replace form-feed characters (page breaks) with newlines
 * - Collapse triple+ blank lines to a single blank line
 */
function cleanPdfText(raw: string): string {
  return raw
    .replace(/\f/g, "\n")
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export class PdfAdapter implements MenuIngestionAdapter<Buffer> {
  readonly sourceType = "pdf" as const;

  async ingest(pdfBuffer: Buffer, meta: IngestionMeta): Promise<NormalizedMenu> {
    const rawText = await extractPdfText(pdfBuffer);
    const cleaned = cleanPdfText(rawText);

    // Reuse the UserUploadAdapter parser — PDF text output is structurally
    // identical to pasted plain text once the layout artifacts are removed.
    const uploadAdapter = new UserUploadAdapter();
    const menu = await uploadAdapter.ingest(cleaned, meta);

    // Override source type and raw snapshot
    menu.sourceType  = "pdf";
    menu.rawSnapshot = cleaned.slice(0, 5_000);

    return menu;
  }
}