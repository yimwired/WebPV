import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Projects } from "@/components/site/projects";
import { About } from "@/components/site/about";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />
        <About />
        <Footer />
      </main>
    </>
  );
}
