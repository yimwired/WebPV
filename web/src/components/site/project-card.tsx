"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { STATUS_LABEL, type Project } from "@/lib/projects";

const statusDot: Record<Project["status"], string> = {
  live: "bg-emerald-400",
  active: "bg-emerald-400",
  building: "bg-amber-400",
  paused: "bg-zinc-500",
};

function CardMedia({ project }: { project: Project }) {
  return (
    <div className="relative z-10 mb-6 aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
      {project.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt={`${project.name} preview`}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="relative h-full w-full"
          style={{
            background: `linear-gradient(135deg, ${project.accent}26, transparent 55%), var(--card)`,
          }}
        >
          <div className="bg-grid absolute inset-0 opacity-40" />
          {/* faux window chrome — signals "screenshot goes here" */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
          <div className="grid h-full place-items-center">
            <span
              className="text-6xl font-semibold tracking-tight opacity-25"
              style={{ color: project.accent }}
            >
              {project.name.charAt(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const external = project.href.startsWith("http");

  return (
    <motion.a
      href={project.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-md transition-colors hover:border-white/20 sm:p-6"
    >
      {/* accent glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(480px circle at 50% 0%, ${project.accent}22, transparent 70%)`,
        }}
      />

      <CardMedia project={project} />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {project.category}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground/80">
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`}
          />
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
        <h3 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h3>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>

      <p
        className="relative z-10 mt-1 text-sm font-medium"
        style={{ color: project.accent }}
      >
        {project.tagline}
      </p>

      <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      <div className="relative z-10 mt-6 flex flex-wrap gap-2">
        {project.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.a>
  );
}
