/**
 * The fields of the Common Paper Mutual NDA Cover Page (Version 1.0).
 *
 * Only the Cover Page varies between agreements. The Standard Terms are
 * incorporated by reference and must stay identical to the published version,
 * so they are never modelled here - see `standardTerms.ts`.
 */

/** A signatory to the agreement. */
export interface Party {
  printName: string;
  title: string;
  company: string;
  /** Either an email or a postal address; the Cover Page permits both. */
  noticeAddress: string;
}

/**
 * "MNDA Term" - how long the agreement itself lasts. The Cover Page offers two
 * mutually exclusive checkboxes, so this is a union rather than a string: it is
 * not possible to represent a document with both or neither box ticked.
 */
export type MndaTerm =
  | { kind: "expires"; years: number }
  | { kind: "untilTerminated" };

/**
 * "Term of Confidentiality" - how long the obligations survive. Independent of
 * `MndaTerm`: confidentiality routinely outlives the agreement.
 */
export type ConfidentialityTerm =
  | { kind: "years"; years: number }
  | { kind: "perpetuity" };

export interface NdaFormData {
  /** How Confidential Information may be used. */
  purpose: string;
  /** ISO `YYYY-MM-DD`, as produced by an `<input type="date">`. */
  effectiveDate: string;
  mndaTerm: MndaTerm;
  confidentialityTerm: ConfidentialityTerm;
  /** The state whose law governs, e.g. "Delaware". */
  governingLaw: string;
  /** Where suits must be brought, e.g. "New Castle County, Delaware". */
  jurisdiction: string;
  /** Free-text changes to the MNDA. These control over the Standard Terms. */
  modifications: string;
  partyOne: Party;
  partyTwo: Party;
}
