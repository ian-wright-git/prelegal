"use client";

import { useEffect, useMemo, useState } from "react";

import { NdaDocument } from "@/components/NdaDocument";
import { NdaForm } from "@/components/NdaForm";
import { createEmptyNda } from "@/lib/nda/defaults";
import { findMissingFields, suggestedDocumentName } from "@/lib/nda/format";

interface NdaCreatorProps {
  /** The Standard Terms as HTML, loaded from templates/ when the page is built. */
  standardTermsHtml: string;
}

/**
 * Holds the agreement being drafted and keeps the form and the document preview
 * in step. State lives in memory only - nothing is saved or sent anywhere.
 */
export const NdaCreator = ({ standardTermsHtml }: NdaCreatorProps) => {
  const [data, setData] = useState(createEmptyNda);

  const missing = useMemo(() => findMissingFields(data), [data]);

  // The browser names the PDF after the document title, so steer it towards
  // something recognisable. The title is restored from an afterprint listener
  // rather than on the next line, because window.print() only blocks until the
  // dialog closes in some browsers - in Firefox it returns immediately, and an
  // inline restore would put the page title back before the dialog reads it.
  const download = () => {
    const original = document.title;
    const restore = () => {
      document.title = original;
      window.removeEventListener("afterprint", restore);
    };

    window.addEventListener("afterprint", restore);
    document.title = suggestedDocumentName(data);
    window.print();
  };

  // A blank effective date is unhelpful on first load; default to today. Set
  // after mount so the server and client render the same initial markup.
  useEffect(() => {
    setData((current) =>
      current.effectiveDate === ""
        ? { ...current, effectiveDate: todayIso() }
        : current,
    );
  }, []);

  return (
    <div className="layout">
      <div className="pane-form">
        <div className="pane-header">
          <h2>Agreement details</h2>
          <p className="muted">
            The document updates as you type. Unfilled fields appear in brackets.
          </p>
        </div>
        <NdaForm data={data} onChange={setData} />
      </div>

      <div>
        <div className="pane-header pane-actions">
          <div>
            <h2>Preview</h2>
            {missing.length > 0 ? (
              <p className="warning">
                {missing.length} field{missing.length === 1 ? "" : "s"} still to
                complete: {missing.join(", ")}.
              </p>
            ) : (
              <p className="muted">Ready to sign.</p>
            )}
          </div>
          <button type="button" className="download" onClick={download}>
            Download PDF
          </button>
        </div>

        <div className="document-frame">
          <NdaDocument data={data} standardTermsHtml={standardTermsHtml} />
        </div>
      </div>
    </div>
  );
};

/** Today's date as `YYYY-MM-DD` in the visitor's own timezone. */
const todayIso = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
