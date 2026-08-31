import { describe, expect, it } from "vitest";

import { createEmptyNda } from "./defaults";
import {
  clampYears,
  findMissingFields,
  formatConfidentialityTerm,
  formatEffectiveDate,
  formatMndaTerm,
  formatYears,
  orPlaceholder,
  suggestedDocumentName,
} from "./format";

describe("orPlaceholder", () => {
  it("uses the value when one is given", () => {
    expect(orPlaceholder("Delaware", "Fill in state")).toBe("Delaware");
  });

  it("trims surrounding whitespace", () => {
    expect(orPlaceholder("  Delaware  ", "Fill in state")).toBe("Delaware");
  });

  it("falls back to a bracketed placeholder when blank", () => {
    expect(orPlaceholder("   ", "Fill in state")).toBe("[Fill in state]");
  });
});

describe("formatEffectiveDate", () => {
  it("formats an ISO date the way a document reads", () => {
    expect(formatEffectiveDate("2026-01-05")).toBe("January 5, 2026");
  });

  it("does not shift the day across timezones", () => {
    // `new Date("2026-01-01")` is UTC midnight, which is 31 December in any
    // negative-offset timezone. The calendar date entered must survive.
    expect(formatEffectiveDate("2026-01-01")).toBe("January 1, 2026");
  });

  it("returns a placeholder for an empty or malformed date", () => {
    expect(formatEffectiveDate("")).toBe("[Today's date]");
    expect(formatEffectiveDate("5 January 2026")).toBe("[Today's date]");
  });

  it("rejects a well-formed date that does not exist", () => {
    expect(formatEffectiveDate("2026-02-31")).toBe("[Today's date]");
  });

  it("rejects a two-digit year rather than reading it as the 1900s", () => {
    // `new Date(26, 7, 30)` is 1926, not 2026. A date input holding "0026-08-30"
    // must not silently produce an agreement dated a century early.
    expect(formatEffectiveDate("0026-08-30")).toBe("[Today's date]");
  });
});

describe("formatYears", () => {
  it("uses the singular for one year", () => {
    expect(formatYears(1)).toBe("1 year");
  });

  it("uses the plural otherwise", () => {
    expect(formatYears(3)).toBe("3 years");
  });
});

describe("formatMndaTerm", () => {
  it("states the expiry when the agreement is time-limited", () => {
    expect(formatMndaTerm({ kind: "expires", years: 2 })).toBe(
      "Expires 2 years from the Effective Date.",
    );
  });

  it("states the alternative when it runs until terminated", () => {
    expect(formatMndaTerm({ kind: "untilTerminated" })).toContain(
      "until terminated",
    );
  });
});

describe("formatConfidentialityTerm", () => {
  it("keeps the trade secret carve-out on the time-limited option", () => {
    const clause = formatConfidentialityTerm({ kind: "years", years: 1 });
    expect(clause).toContain("1 year from the Effective Date");
    expect(clause).toContain("trade secret");
  });

  it("states perpetuity on the other option", () => {
    expect(formatConfidentialityTerm({ kind: "perpetuity" })).toBe(
      "In perpetuity.",
    );
  });
});

describe("findMissingFields", () => {
  it("reports every unfilled field on a blank agreement", () => {
    const missing = findMissingFields(createEmptyNda());

    // Purpose is prefilled from the template's default, so it is not missing.
    expect(missing).toContain("Effective date");
    expect(missing).toContain("Governing law");
    expect(missing).toContain("Party 1: company");
    expect(missing).toContain("Party 2: notice address");
    expect(missing).not.toContain("Purpose");
  });

  it("reports nothing once the required fields are filled", () => {
    const party = {
      printName: "Ada Lovelace",
      title: "CEO",
      company: "Acme",
      noticeAddress: "ada@acme.test",
    };
    const complete = {
      ...createEmptyNda(),
      effectiveDate: "2026-01-05",
      governingLaw: "Delaware",
      jurisdiction: "New Castle County, Delaware",
      partyOne: party,
      partyTwo: { ...party, printName: "Grace Hopper", company: "Globex" },
    };

    expect(findMissingFields(complete)).toEqual([]);
  });

  it("treats whitespace as unfilled", () => {
    const data = { ...createEmptyNda(), governingLaw: "   " };
    expect(findMissingFields(data)).toContain("Governing law");
  });

  it("requires exactly the fields needed to sign, and no others", () => {
    // Pinned as an exact set: modifications and the party titles are optional,
    // and signature and date lines are filled in by hand after printing.
    expect(findMissingFields(createEmptyNda())).toEqual([
      "Effective date",
      "Governing law",
      "Jurisdiction",
      "Party 1: print name",
      "Party 1: company",
      "Party 1: notice address",
      "Party 2: print name",
      "Party 2: company",
      "Party 2: notice address",
    ]);
  });
});

describe("suggestedDocumentName", () => {
  it("names the file after both companies", () => {
    const data = createEmptyNda();
    data.partyOne.company = "Acme Corp";
    data.partyTwo.company = "Globex, Inc.";

    expect(suggestedDocumentName(data)).toBe("Mutual-NDA-Acme-Corp-Globex-Inc");
  });

  it("falls back to a bare name when no company is given", () => {
    expect(suggestedDocumentName(createEmptyNda())).toBe("Mutual-NDA");
  });

  it("uses whichever company is filled in", () => {
    const data = createEmptyNda();
    data.partyTwo.company = "Globex";

    expect(suggestedDocumentName(data)).toBe("Mutual-NDA-Globex");
  });

  it("leaves no stray hyphen when a long company name is truncated", () => {
    const data = createEmptyNda();
    // The 40-character cut lands on a word separator, which must not survive.
    data.partyOne.company = "Acme Corporation International Holdings Ltd";
    data.partyTwo.company = "Globex";

    const name = suggestedDocumentName(data);
    expect(name).toBe(
      "Mutual-NDA-Acme-Corporation-International-Holdings-Globex",
    );
    expect(name).not.toContain("--");
  });
});

describe("clampYears", () => {
  it("reads a typed number", () => {
    expect(clampYears("7", 1)).toBe(7);
  });

  it("falls back when the box is empty or not a number", () => {
    expect(clampYears("", 5)).toBe(5);
    expect(clampYears("abc", 5)).toBe(5);
  });

  it("clamps to a range a real agreement would use", () => {
    expect(clampYears("0", 1)).toBe(1);
    expect(clampYears("-3", 1)).toBe(1);
    expect(clampYears("500", 1)).toBe(99);
  });
});
