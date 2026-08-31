import type { ConfidentialityTerm, MndaTerm, NdaFormData } from "./types";

/**
 * Renders a value for the document, falling back to the Cover Page's own
 * bracketed-placeholder convention when the user has not filled the field in.
 * Keeping unfilled fields visible (rather than blank) makes an incomplete
 * agreement obvious in both the preview and a printed copy.
 */
export const orPlaceholder = (value: string, placeholder: string): string =>
  value.trim() === "" ? `[${placeholder}]` : value.trim();

/** The range of years an agreement term may be set to. */
export const MIN_TERM_YEARS = 1;
export const MAX_TERM_YEARS = 99;

/**
 * Reads a year count typed into a number input, clamping it to a range a real
 * agreement would use and falling back when the field does not hold a number.
 */
export const clampYears = (raw: string, fallback: number): number => {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) return fallback;
  return Math.min(Math.max(value, MIN_TERM_YEARS), MAX_TERM_YEARS);
};

/**
 * Formats an ISO `YYYY-MM-DD` date as it should read in a legal document, e.g.
 * "January 5, 2026".
 *
 * The date is parsed as calendar parts rather than passed to `new Date(iso)`,
 * which would read the string as UTC midnight and render as the previous day
 * for anyone in a negative-offset timezone.
 */
export const formatEffectiveDate = (iso: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "[Today's date]";

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  // Every part is re-checked against what was asked for, because the Date
  // constructor silently rewrites two kinds of bad input: it rolls impossible
  // dates forward (2026-02-31 becomes 3 March), and it maps years 0-99 onto
  // 1900-1999, so a date field left holding "0026-08-30" would otherwise be
  // rendered as "August 30, 1926" on an agreement that looks complete.
  const asked =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  if (!asked) return "[Today's date]";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** Pluralises a whole number of years: "1 year", "2 years". */
export const formatYears = (years: number): string =>
  `${years} ${years === 1 ? "year" : "years"}`;

/** The MNDA Term clause, matching the Cover Page's wording. */
export const formatMndaTerm = (term: MndaTerm): string =>
  term.kind === "expires"
    ? `Expires ${formatYears(term.years)} from the Effective Date.`
    : "Continues until terminated in accordance with the terms of the MNDA.";

/** The Term of Confidentiality clause, matching the Cover Page's wording. */
export const formatConfidentialityTerm = (term: ConfidentialityTerm): string =>
  term.kind === "years"
    ? `${formatYears(term.years)} from the Effective Date, but in the case of ` +
      "trade secrets until the Confidential Information is no longer " +
      "considered a trade secret under applicable laws."
    : "In perpetuity.";

/**
 * Lists the fields still to be completed, labelled as the form labels them.
 * Signature and date lines are excluded deliberately - those are filled in on
 * paper, after the document is printed.
 */
export const findMissingFields = (data: NdaFormData): string[] => {
  const missing: string[] = [];
  const require = (value: string, label: string) => {
    if (value.trim() === "") missing.push(label);
  };

  require(data.purpose, "Purpose");
  require(data.effectiveDate, "Effective date");
  require(data.governingLaw, "Governing law");
  require(data.jurisdiction, "Jurisdiction");

  const parties = [
    { party: data.partyOne, name: "Party 1" },
    { party: data.partyTwo, name: "Party 2" },
  ];
  for (const { party, name } of parties) {
    require(party.printName, `${name}: print name`);
    require(party.company, `${name}: company`);
    require(party.noticeAddress, `${name}: notice address`);
  }

  return missing;
};

/**
 * A filename for the downloaded agreement, derived from the two companies so a
 * folder of these stays tellable apart, e.g. "Mutual-NDA-Acme-Globex".
 */
export const suggestedDocumentName = (data: NdaFormData): string => {
  const slug = (value: string) =>
    value
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      // Trimmed after truncating, not before: a long name cut mid-separator
      // would otherwise keep a trailing hyphen and double up against the join.
      .slice(0, 40)
      .replace(/^-+|-+$/g, "");

  const parts = [slug(data.partyOne.company), slug(data.partyTwo.company)].filter(
    (part) => part !== "",
  );

  return ["Mutual-NDA", ...parts].join("-");
};
