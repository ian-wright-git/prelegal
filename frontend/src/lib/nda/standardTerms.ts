import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

import "server-only";

/**
 * The Standard Terms are read at build time from the repository's curated
 * template set rather than copied into this app.
 *
 * The Cover Page incorporates the Standard Terms by reference, stating they are
 * "identical to those posted at commonpaper.com/standards/mutual-nda/1.0". A
 * second copy of that text living in the frontend could drift from the source
 * and quietly break that representation, so there is exactly one copy.
 */
const TEMPLATE_PATH = path.join(
  process.cwd(),
  "..",
  "templates",
  "Mutual-NDA.md",
);

/**
 * Loads the Standard Terms as HTML.
 *
 * The heading and the trailing CC BY attribution line are dropped: the document
 * supplies its own section heading, and the attribution is rendered once in the
 * document footer instead of twice.
 */
export const loadStandardTermsHtml = async (): Promise<string> => {
  const markdown = await readFile(TEMPLATE_PATH, "utf8");

  const body = markdown
    .replace(/^#\s+Standard Terms\s*/m, "")
    .replace(/^Common Paper Mutual Non-Disclosure Agreement.*$/gm, "")
    .trim();

  return marked.parse(body, { async: false });
};
