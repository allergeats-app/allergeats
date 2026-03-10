/**
 * lib/menu-ingestion/adapters/pdfAdapter.ts
 *
 * STUB — PDF menu adapter.
 *
 * Ingests menus from PDF files, which are common for fine dining,
 * seasonal menus, and chains that publish printable menu PDFs.
 *
 * Confidence: MEDIUM — extracted text may have layout artifacts,
 * especially from multi-column layouts or image-heavy PDFs.
 *
 * TODO when implementing:
 *   1. Choose PDF extraction library:
 *      - pdf-parse (npm) — simple text extraction, no layout awareness
 *      - pdfjs-dist — full PDF.js, supports page-by-page extraction
 *      - Recommended: pdfjs-dist for production quality
 *   2. Extract text page by page
 *   3. Feed extracted text into UserUploadAdapter logic
 *      (PDF text output is structurally similar to pasted text)
 *   4. Handle multi-column layouts (common in restaurant menus):
 *      sort text blocks by x-coordinate before joining lines
 *   5. Image-only PDFs → fall back to imageAdapter (OCR required)
 *
 * Input: Buffer or base64-encoded PDF content
 *
 * Required additional dependency:
 *   npm install pdfjs-dist  (or pdf-parse for simpler use case)
 */

import type { MenuIngestionAdapter, NormalizedMenu, IngestionMeta } from "../types";
import { buildMenuShell, buildSection } from "./base";

export class PdfAdapter implements MenuIngestionAdapter<string> {
  readonly sourceType = "pdf" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ingest(_pdfBase64: string, meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("pdf", meta);

    // TODO: implement PDF text extraction
    // const text = await extractTextFromPdf(pdfBase64);
    // const uploadAdapter = new UserUploadAdapter();
    // return uploadAdapter.ingest(text, meta);

    menu.sections = [buildSection("Menu")];
    return menu;
  }
}
