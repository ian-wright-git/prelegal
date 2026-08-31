"use client";

import { useState } from "react";

import { MAX_TERM_YEARS, MIN_TERM_YEARS, clampYears } from "@/lib/nda/format";
import type {
  ConfidentialityTerm,
  MndaTerm,
  NdaFormData,
  Party,
} from "@/lib/nda/types";

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {hint ? <span className="field-hint">{hint}</span> : null}
    {children}
  </label>
);

/**
 * The "N year(s) from the effective date" option shared by both term fields.
 *
 * The typed number is held here as raw text rather than read straight from the
 * agreement, for two reasons. Emptying the box has to be possible mid-edit - if
 * the value round-tripped through the agreement it would snap back to a number
 * the moment it was cleared, putting the caret after it, so deleting "10" to
 * type "25" would leave "1025" clamped to 99. And the draft has to outlive the
 * option being deselected, so switching to the other option to read its wording
 * and switching back does not silently reset the term to one year.
 */
const YearsOption = ({
  name,
  prefix,
  selected,
  years,
  onSelect,
}: {
  name: string;
  /** Leading word, where the Cover Page prints one ("Expires 1 year..."). */
  prefix?: string;
  selected: boolean;
  /** The agreed number of years, when this option is the selected one. */
  years: number | undefined;
  onSelect: (years: number) => void;
}) => {
  const [draft, setDraft] = useState(String(years ?? MIN_TERM_YEARS));
  const settled = () => clampYears(draft, MIN_TERM_YEARS);

  return (
    <label className="choice">
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={() => onSelect(settled())}
      />
      {prefix ? <span>{prefix}</span> : null}
      <input
        type="number"
        className="years"
        min={MIN_TERM_YEARS}
        max={MAX_TERM_YEARS}
        value={draft}
        disabled={!selected}
        onChange={(e) => {
          setDraft(e.target.value);
          // An empty or half-typed box leaves the agreement on its last good
          // value; it is normalised on blur, not fought over per keystroke.
          if (e.target.value.trim() !== "") {
            onSelect(clampYears(e.target.value, years ?? MIN_TERM_YEARS));
          }
        }}
        onBlur={() => setDraft(String(settled()))}
      />
      <span>year(s) from the effective date</span>
    </label>
  );
};

/** The inputs describing one signatory. */
const PartyFieldset = ({
  heading,
  party,
  onChange,
}: {
  heading: string;
  party: Party;
  onChange: (party: Party) => void;
}) => (
  <fieldset>
    <legend>{heading}</legend>
    <Field label="Print name">
      <input
        type="text"
        value={party.printName}
        onChange={(e) => onChange({ ...party, printName: e.target.value })}
        placeholder="Ada Lovelace"
      />
    </Field>
    <Field label="Title">
      <input
        type="text"
        value={party.title}
        onChange={(e) => onChange({ ...party, title: e.target.value })}
        placeholder="Chief Executive Officer"
      />
    </Field>
    <Field label="Company">
      <input
        type="text"
        value={party.company}
        onChange={(e) => onChange({ ...party, company: e.target.value })}
        placeholder="Acme Corp"
      />
    </Field>
    {/* A textarea because the Cover Page accepts a postal address here as
        readily as an email, and an address needs its line breaks. */}
    <Field label="Notice address" hint="An email or postal address">
      <textarea
        value={party.noticeAddress}
        rows={2}
        onChange={(e) => onChange({ ...party, noticeAddress: e.target.value })}
        placeholder="legal@acme.test"
      />
    </Field>
  </fieldset>
);

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

/** The intake form. */
export const NdaForm = ({ data, onChange }: NdaFormProps) => {
  const update = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) =>
    onChange({ ...data, [key]: value });

  const setMndaTerm = (term: MndaTerm) => update("mndaTerm", term);
  const setConfidentialityTerm = (term: ConfidentialityTerm) =>
    update("confidentialityTerm", term);

  return (
    <form className="form" onSubmit={(e) => e.preventDefault()}>
      <fieldset>
        <legend>The agreement</legend>

        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            value={data.purpose}
            rows={3}
            onChange={(e) => update("purpose", e.target.value)}
          />
        </Field>

        <Field label="Effective date">
          <input
            type="date"
            value={data.effectiveDate}
            // Bounded so a mistyped two-digit year cannot reach the agreement
            // as a date in the 1900s; formatEffectiveDate rejects it too.
            min="1900-01-01"
            max="2999-12-31"
            onChange={(e) => update("effectiveDate", e.target.value)}
          />
        </Field>
      </fieldset>

      <fieldset>
        <legend>MNDA term</legend>
        <p className="field-hint">The length of this MNDA</p>

        <YearsOption
          name="mnda-term"
          prefix="Expires"
          selected={data.mndaTerm.kind === "expires"}
          years={
            data.mndaTerm.kind === "expires" ? data.mndaTerm.years : undefined
          }
          onSelect={(years) => setMndaTerm({ kind: "expires", years })}
        />

        <label className="choice">
          <input
            type="radio"
            name="mnda-term"
            checked={data.mndaTerm.kind === "untilTerminated"}
            onChange={() => setMndaTerm({ kind: "untilTerminated" })}
          />
          <span>Continues until terminated under the terms of the MNDA</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Term of confidentiality</legend>
        <p className="field-hint">
          How long Confidential Information is protected
        </p>

        <YearsOption
          name="confidentiality-term"
          selected={data.confidentialityTerm.kind === "years"}
          years={
            data.confidentialityTerm.kind === "years"
              ? data.confidentialityTerm.years
              : undefined
          }
          onSelect={(years) => setConfidentialityTerm({ kind: "years", years })}
        />

        <label className="choice">
          <input
            type="radio"
            name="confidentiality-term"
            checked={data.confidentialityTerm.kind === "perpetuity"}
            onChange={() => setConfidentialityTerm({ kind: "perpetuity" })}
          />
          <span>In perpetuity</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Governing law &amp; jurisdiction</legend>

        <Field label="Governing law" hint="The state whose law applies">
          <input
            type="text"
            value={data.governingLaw}
            onChange={(e) => update("governingLaw", e.target.value)}
            placeholder="Delaware"
          />
        </Field>

        <Field label="Jurisdiction" hint="City or county, and state">
          <input
            type="text"
            value={data.jurisdiction}
            onChange={(e) => update("jurisdiction", e.target.value)}
            placeholder="New Castle County, Delaware"
          />
        </Field>
      </fieldset>

      <PartyFieldset
        heading="Party 1"
        party={data.partyOne}
        onChange={(party) => update("partyOne", party)}
      />
      <PartyFieldset
        heading="Party 2"
        party={data.partyTwo}
        onChange={(party) => update("partyTwo", party)}
      />

      <fieldset>
        <legend>Modifications</legend>
        <Field
          label="MNDA modifications"
          hint="Optional. Changes recorded here control over the Standard Terms."
        >
          <textarea
            value={data.modifications}
            rows={3}
            onChange={(e) => update("modifications", e.target.value)}
            placeholder="Leave blank if the standard terms are unchanged."
          />
        </Field>
      </fieldset>
    </form>
  );
};
