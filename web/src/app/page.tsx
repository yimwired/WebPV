import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Showcase } from "@/components/site/showcase";
import { Pains } from "@/components/site/pains";
import { PromiseCard } from "@/components/site/promise-card";
import { Platform } from "@/components/site/platform";
import { Projects } from "@/components/site/projects";
import { About } from "@/components/site/about";
import { Footer } from "@/components/site/footer";

// Headline in a cloud of work, the work by kind, the usual worries crossed out
// on a dark ground, the card that answers them, what comes with it, then the
// proof and the way in. Light and deep blue sections alternate down the page.
export default function Home() {
  return (
    <div className="font-site">
      <Navbar />
      {/* tabIndex -1: without it the skip link moves the scroll position but
          not the focus, so the next Tab goes back into the navbar */}
      <main id="main" tabIndex={-1}>
        <Hero />
        <Showcase />
        <Pains />
        <PromiseCard />
        <Platform />
        <Projects />
        <About />
        <Footer />
      </main>
    </div>
  );
}
