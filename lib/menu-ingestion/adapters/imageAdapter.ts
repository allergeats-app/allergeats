/**
 * lib/menu-ingestion/adapters/imageAdapter.ts
 *
 * STUB — Image/OCR menu adapter.
 *
 * Ingests menus from photos or scanned images (JPEG, PNG, HEIC, TIFF).
 * OCR quality varies significantly — confidence is LOW until results are
 * reviewed and corrected via user feedback.
 *
 * Confidence: LOW (can upgrade to MEDIUM for high-quality scans with
 * human review via the feedback system).
 *
 * TODO when implementing:
 *   1. OCR options (in order of recommendation):
 *      A. Existing /api/scan-photo route — already uses OpenAI Vision
 *         → Extract OCR text from that response and feed into UserUploadAdapter
 *      B. Google Cloud Vision API (best accuracy, requires credentials)
 *         → Returns structured text blocks with coordinates
 *      C. Tesseract.js (npm, runs in browser) — fallback for offline use
 *   2. For option A (simplest path):
 *      - POST image to /api/scan-photo
 *      - Receive structured item list back
 *      - Map to NormalizedMenu
 *   3. For option B:
 *      - Use Vision API TEXT_DETECTION
 *      - Sort text blocks by bounding box position (top → bottom, left → right)
 *      - Feed sorted text through UserUploadAdapter
 *   4. Store original image URL in sourceUrl for traceability
 *   5. After OCR: user should be able to correct items via feedback system
 *
 * Input: base64-encoded image string or image URL
 */

import type { MenuIngestionAdapter, NormalizedMenu, IngestionMeta } from "../types";
import { buildMenuShell, buildSection } from "./base";

export class ImageAdapter implements MenuIngestionAdapter<string> {
  readonly sourceType = "image" as const;

  async ingest(_imageInput: string, meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("image", meta);

    // TODO: implement OCR pipeline
    // Option A (recommended — uses existing infrastructure):
    //   const ocrText = await callScanPhotoApi(imageInput);
    //   const uploadAdapter = new UserUploadAdapter();
    //   return uploadAdapter.ingest(ocrText, meta);

    menu.sections = [buildSection("Menu")];
    return menu;
  }
}
