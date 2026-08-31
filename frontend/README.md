# prelegal frontend

A prototype web app that creates a
[Common Paper Mutual NDA](https://commonpaper.com/standards/mutual-nda/1.0)
from a short form ([PL-3](https://ianwright.atlassian.net/browse/PL-3)).

Fill in the agreement details on the left, watch the document assemble on the
right, and download a copy with **Download PDF**.

## Running it

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm test`.

## How the document is put together

The agreement has two halves, and they are handled differently on purpose.

**The Cover Page is generated.** It holds every variable field — purpose,
effective date, the two term choices, governing law, jurisdiction, modifications
and the two parties — and is rendered from form state in
`components/NdaDocument.tsx`.

**The Standard Terms are reproduced verbatim.** The Cover Page incorporates them
by reference, stating they are "identical to those posted at
commonpaper.com/standards/mutual-nda/1.0". They are therefore read from
`../templates/Mutual-NDA.md` — the curated template set added in PL-2 — rather
than copied into this app, so there is exactly one copy that cannot drift from
the source. See `lib/nda/standardTerms.ts`.

Because the template is read from outside `frontend/`, the repository root must
be present at build time, and editing the template requires a rebuild to take
effect.

## Download

Download is `window.print()` against a print stylesheet, so the browser produces
the PDF. `@media print` in `app/globals.css` hides the form and site chrome and
prints the document alone, starting the Standard Terms on a fresh page.

## Layout

```
src/
  app/           page (server component: loads the template), layout, styles
  components/    NdaCreator (state) -> NdaForm + NdaDocument
  lib/nda/       types, defaults, formatting, template loader
```

Nothing is persisted or transmitted: the agreement lives in React state for the
life of the tab.

## Scope

A prototype covering the Mutual NDA only. The other templates in the catalog are
substantially more complex, and generalising before one of them is actually
built would be guesswork.

Generated documents are drafts for information only, are not legal advice, and
carry the CC BY 4.0 attribution that `templates/LICENSE.txt` requires.
