import { ArrowUpRight, Mail } from "lucide-react";
import { Reveal } from "./reveal";

const socials = [
  // add YouTube / X here when the channels are ready
  { label: "GitHub", href: "https://github.com/yimwired" },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      <Reveal className="rounded-[2rem] border border-white/10 bg-card/40 p-8 backdrop-blur-md sm:p-14">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Contact
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Let&apos;s build something.
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Got a project, a collaboration, or just want to say hi? My inbox is
          open.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="mailto:yimwired@gmail.com"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Mail className="h-4 w-4" />
            yimwired@gmail.com
          </a>
          <div className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-12 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 text-sm text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                {s.label}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-10 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Film. All rights reserved.</span>
        <span>Built with Next.js · Tailwind · Framer Motion</span>
      </div>
    </footer>
  );
}
