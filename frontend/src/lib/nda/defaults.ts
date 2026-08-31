import type { NdaFormData, Party } from "./types";

const emptyParty = (): Party => ({
  printName: "",
  title: "",
  company: "",
  noticeAddress: "",
});

/**
 * Starting values for a new agreement. The purpose and both term lengths carry
 * the defaults printed on the Common Paper Cover Page; everything else is blank
 * and renders as a bracketed placeholder until filled in.
 */
export const createEmptyNda = (): NdaFormData => ({
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTerm: { kind: "expires", years: 1 },
  confidentialityTerm: { kind: "years", years: 1 },
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  partyOne: emptyParty(),
  partyTwo: emptyParty(),
});
