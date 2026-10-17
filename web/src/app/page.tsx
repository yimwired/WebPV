import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Showcase } from "@/components/site/showcase";
import { Pains } from "@/components/site/pains";
import { PromiseCard } from "@/components/site/promise-card";
import { Platform } from "@/components/site/platform";
import { Projects } from "@/components/site/projects";
import { About } from "@/components/site/about";
import { Footer } from "@/components/site/footer";

// The order follows fastwork.com's selling page, which Film asked the home
// page to look like (2026-10-17): headline in a cloud of work, the work by
// kind, the worries on a dark ground, the light card that answers them, what
// comes with it, then the proof and the way in.
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
