import { NdaCreator } from "@/components/NdaCreator";
import { loadStandardTermsHtml } from "@/lib/nda/standardTerms";

export default async function Home() {
  const standardTermsHtml = await loadStandardTermsHtml();

  return (
    <main>
      <header className="site-header">
        <div>
          <h1>Mutual NDA</h1>
          <p className="muted">
            Fill in the details, review the agreement, and download a copy.
          </p>
        </div>
        <p className="disclaimer">
          Draft for information only. Not legal advice &mdash; have an attorney
          review before signing.
        </p>
      </header>

      <NdaCreator standardTermsHtml={standardTermsHtml} />
    </main>
  );
}
