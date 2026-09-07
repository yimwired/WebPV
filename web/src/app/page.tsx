import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Projects } from "@/components/site/projects";
import { LabStrip } from "@/components/site/lab-strip";
import { About } from "@/components/site/about";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* tabIndex -1: without it the skip link moves the scroll position but
          not the focus, so the next Tab goes back into the navbar */}
      <main id="main" tabIndex={-1}>
        <Hero />
        <Projects />
        <LabStrip />
        <About />
        <Footer />
      </main>
    </>
  );
}
