/**
 * Fetches a PDF from a URL and extracts its text with pdf-parse.
 * Usage: node scripts/pdf-to-text.mjs <url> [output-file]
 * Output goes to stdout; progress/errors go to stderr.
 */
import { writeFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const [,, pdfUrl, outFile] = process.argv;
if (!pdfUrl) { process.stderr.write("Usage: node scripts/pdf-to-text.mjs <url> [output-file]\n"); process.exit(1); }

process.stderr.write(`Fetching: ${pdfUrl}\n`);
const resp = await fetch(pdfUrl, {
  headers: { "User-Agent": "AllergEats-AllergenBot/1.0 (+https://www.allergeats.com)" },
  signal: AbortSignal.timeout(60_000),
});
if (!resp.ok) { process.stderr.write(`HTTP ${resp.status}\n`); process.exit(1); }
const buf = Buffer.from(await resp.arrayBuffer());
process.stderr.write(`Downloaded ${(buf.length / 1024).toFixed(1)} KB\n`);

const pdfParse = require("pdf-parse");
const data = await pdfParse(buf);
process.stderr.write(`Pages: ${data.numpages}\n`);

const text = data.text;
if (outFile) { writeFileSync(outFile, text); process.stderr.write(`Saved to ${outFile}\n`); }
else process.stdout.write(text);
