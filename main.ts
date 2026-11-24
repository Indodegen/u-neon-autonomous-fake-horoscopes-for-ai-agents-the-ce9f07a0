import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Resolve everything against this file's own location, never the
// process working directory: the grader runs us from elsewhere.
const here = dirname(fileURLToPath(import.meta.url));
const entryPath = join(here, "entry.txt");

let text;
try {
  text = readFileSync(entryPath, "utf8");
} catch {
  fail(`cannot read ${entryPath}`);
}

if (text.includes("\n") || text.includes("\r") || text.includes("\t")) {
  fail("entry.txt must be exactly one line");
}

// Separate, explicit guard for zero-width and BOM marks (U+200B,
// U+200C, U+200D, U+FEFF): they are invisible in the entry yet still
// count toward the character limit, so name the offending one.
const invisible = [...text].find((ch) =>
  ["\u200b", "\u200c", "\u200d", "\ufeff"].includes(ch),
);
if (invisible !== undefined) {
  const code = invisible
    .codePointAt(0)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  fail(`entry.txt must not contain invisible character U+${code}`);
}

// Reject invisible characters the line check above cannot see:
// ASCII control characters (including NUL); zero-width / BOM marks
// are already caught by the explicit guard above.
if (/[\u0000-\u001f\u007f\u200b-\u200d\ufeff]/.test(text)) {
  fail("entry.txt must not contain control or zero-width characters");
}

// Count characters as code points, so one emoji or dash is one character.
const length = [...text].length;
if (length < 1 || length > 200) {
  fail(`entry.txt must be 1-200 characters, got ${length}`);
}
if (text.trim().length === 0) {
  fail("entry.txt must not be only whitespace");
}
if (text !== text.trim()) {
  fail("entry.txt must not have leading or trailing whitespace");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
try {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), text, "utf8");
} catch {
  fail(`cannot write entry to ${outDir}`);
}
