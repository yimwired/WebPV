"use client";

import { MapPin } from "lucide-react";
import { Reveal } from "./reveal";
import { withCounts } from "@/lib/counts";
import { useLocale } from "@/lib/i18n";
import { PROFILES } from "@/lib/site";
import { skills } from "@/lib/skills";

const github = PROFILES.find((profile) => profile.label === "GitHub");

/**
 * Who builds all of this: the story on the left, and on the right the short
 * profile card fastwork.com shows for a seller, with only facts in it.
 */
export function About() {
  const { t } = useLocale();

  return (
    <section
      id="about"
      className="scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-28"
    >
      <div className="border-line mx-auto grid max-w-[1180px] gap-12 border-t pt-16 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <Reveal>
          <h2 className="text-[32px] leading-[1.1] font-medium tracking-[-0.025em] sm:text-[44px]">
            {t.about.title}
          </h2>
          <div className="text-muted-foreground mt-6 space-y-4 text-[17px] leading-relaxed">
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
          </div>

          <h3 className="mt-10 text-[15px] font-medium">{t.about.label}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li
                key={skill}
                className="border-line-strong rounded-full border px-3 py-1.5 text-[14px]"
              >
                {skill}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="bg-surface rounded-[36px] p-2">
            <div className="border-line bg-background rounded-[28px] border p-6 sm:p-8">
              <p className="text-muted-foreground text-[15px]">{t.about.profile}</p>

              <div className="mt-4 flex items-center gap-4">
                {/* No photo on the site yet, so the avatar is a monogram
                    rather than a stand-in face. */}
                <span
                  aria-hidden
                  className="bg-brand text-background grid h-16 w-16 shrink-0 place-items-center rounded-full text-[26px] font-semibold"
                >
                  F
                </span>
                <div className="min-w-0">
                  <p className="text-[22px] leading-tight font-medium tracking-tight">
                    {t.about.name}{" "}
                    <span className="text-muted-foreground">({t.about.nickname})</span>
                  </p>
                  <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                    {github && (
                      <a
                        href={github.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground -my-1 py-1 underline underline-offset-2"
                      >
                        @yimwired
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden className="h-3.5 w-3.5" />
                      {t.about.location}
                    </span>
                  </p>
                </div>
              </div>

              <dl className="border-line mt-6 grid grid-cols-3 rounded-[16px] border py-3">
                {t.about.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border-line flex flex-col-reverse items-center border-s px-2 text-center first:border-s-0"
                  >
                    <dt className="text-muted-foreground mt-1 text-[12px] leading-tight text-balance">
                      {stat.label}
                    </dt>
                    {/* keeps the project count honest as projects.ts grows */}
                    <dd className="text-[17px] leading-tight font-medium">
                      {withCounts(stat.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
