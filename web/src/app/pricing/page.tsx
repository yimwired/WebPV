import { pageMetadata } from "@/lib/seo";
import { jsonLdHtml, pricingGraph } from "@/lib/structured-data";
import { Navbar } from "@/components/site/navbar";
import { Pricing } from "@/components/site/pricing";
import { Footer } from "@/components/site/footer";

export const metadata = pageMetadata({
  title: "Pricing | Film",
  description:
    "Fixed prices for websites and landing pages, from a Quick page live in three days to a Signature build with custom motion. Automation, dashboards and AI are quoted per project.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="font-site">
      {/* the packages as offers, so a search result can carry the prices */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(pricingGraph()) }}
      />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Pricing />
        <Footer />
      </main>
    </div>
  );
}
