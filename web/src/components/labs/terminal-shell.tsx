"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────
//  The shell in the Terminal lab.
//
//  It is a real prompt, not a scripted animation: what comes back is produced
//  by the command you typed, history walks with the arrow keys, Tab completes,
//  and `open pricing` navigates the actual site. A terminal that only plays a
//  recording is the exact thing a developer audience notices first.
//
//  Deliberately not a filesystem or a language. Everything here answers a
//  question a visitor evaluating a tool would actually ask, and nothing
//  pretends to more state than it has.
// ─────────────────────────────────────────────────────────────

export interface Line {
  kind: "input" | "output" | "muted" | "good" | "warn";
  text: string;
}

/** Steps that print one after another, so a long command reads as work. */
interface Staged {
  lines: Line[];
  /** ms between steps; 0 prints the lot at once (reduced motion) */
  pace: number;
}

const PRODUCT = "ridge";

const HELP: Line[] = [
  { kind: "muted", text: "commands" },
  { kind: "output", text: "  deploy [staging|prod]   build, upload, and swap traffic" },
  { kind: "output", text: "  status                  what is live, and since when" },
  { kind: "output", text: "  logs [n]                tail the last n lines (default 8)" },
  { kind: "output", text: "  rollback                return to the previous release" },
  { kind: "output", text: "  pricing                 what this costs" },
  { kind: "output", text: "  open <page>             open a page on this site" },
  { kind: "output", text: "  clear                   empty the screen" },
  { kind: "muted", text: "" },
  { kind: "muted", text: "history: up and down · complete: tab" },
];

const STATUS: Line[] = [
  { kind: "muted", text: "ENV        RELEASE   AGE      TRAFFIC   HEALTH" },
  { kind: "output", text: "prod       r-4192    6d 14h   100%      ok" },
  { kind: "output", text: "staging    r-4197    22m      0%        ok" },
  { kind: "muted", text: "" },
  { kind: "output", text: "prod has been up 41 days without a failed request." },
];

const LOG_LINES = [
  "14:22:07  GET  /api/orders          200   12ms",
  "14:22:07  GET  /api/orders/8821     200    9ms",
  "14:22:08  POST /api/orders          201   34ms",
  "14:22:09  GET  /healthz             200    1ms",
  "14:22:11  GET  /api/orders          200   11ms",
  "14:22:12  WARN retrying upstream billing (1/3)",
  "14:22:12  POST /api/orders          201   41ms",
  "14:22:14  GET  /healthz             200    1ms",
  "14:22:15  GET  /api/customers       200   18ms",
  "14:22:16  GET  /api/orders/8822     200    8ms",
];

const DEPLOY_STEPS: Line[] = [
  { kind: "muted", text: "→ reading ridge.toml" },
  { kind: "muted", text: "→ building  (cached: 41 of 44 steps)" },
  { kind: "muted", text: "→ uploading 2.1 MB" },
  { kind: "muted", text: "→ health check  ok in 340ms" },
  { kind: "good", text: "✔ r-4198 live on prod in 11.4s · rollback with `rollback`" },
];

/** Pages `open` will actually navigate to. Anything else is refused by name. */
const PAGES: Record<string, string> = {
  pricing: "/pricing",
  services: "/services",
  labs: "/labs",
  home: "/",
  contact: "/#contact",
};

const COMMANDS = [
  "deploy",
  "status",
  "logs",
  "rollback",
  "pricing",
  "open",
  "clear",
  "help",
];

/**
 * What a command prints.
 *
 * Returns either lines to append, or a staged sequence for the ones that
 * represent work happening over time. `null` means the shell handled it.
 */
function run(input: string, router: ReturnType<typeof useRouter>): Line[] | Staged | null {
  const [command, ...args] = input.trim().split(/\s+/);

  switch (command) {
    case "help":
      return HELP;

    case "status":
      return STATUS;

    case "logs": {
      const n = Math.min(Math.max(Number(args[0]) || 8, 1), LOG_LINES.length);
      return LOG_LINES.slice(-n).map((text) => ({
        kind: text.includes("WARN") ? ("warn" as const) : ("output" as const),
        text,
      }));
    }

    case "deploy": {
      const env = args[0] === "staging" ? "staging" : "prod";
      return {
        pace: 420,
        lines: [
          { kind: "muted", text: `deploying to ${env}` },
          ...DEPLOY_STEPS.map((l) =>
            env === "staging" && l.kind === "good"
              ? { ...l, text: l.text.replace("prod", "staging") }
              : l,
          ),
        ],
      };
    }

    case "rollback":
      return {
        pace: 380,
        lines: [
          { kind: "muted", text: "→ previous release r-4192" },
          { kind: "muted", text: "→ swapping traffic" },
          { kind: "good", text: "✔ rolled back in 2.1s · nothing was rebuilt" },
        ],
      };

    case "pricing":
      return [
        { kind: "muted", text: "PLAN        PROJECTS   BUILD MINUTES   PRICE" },
        { kind: "output", text: "solo        3          2,000/mo        free" },
        { kind: "output", text: "team        unlimited  20,000/mo       $19/seat" },
        { kind: "output", text: "self-host   unlimited  yours           $0, MIT" },
        { kind: "muted", text: "" },
        { kind: "output", text: "type `open pricing` for what a site like this costs to build." },
      ];

    case "open": {
      const page = (args[0] || "").toLowerCase();
      const href = PAGES[page];
      if (!href) {
        return [
          { kind: "warn", text: `open: no page called "${args[0] || ""}"` },
          { kind: "muted", text: `try: ${Object.keys(PAGES).join(", ")}` },
        ];
      }
      router.push(href);
      return [{ kind: "good", text: `opening ${href}` }];
    }

    case "clear":
      return null;

    case "":
      return [];

    default:
      return [
        { kind: "warn", text: `${PRODUCT}: unknown command "${command}"` },
        { kind: "muted", text: "type `help` for the list" },
      ];
  }
}

interface ShellProps {
  /** false under prefers-reduced-motion: staged output prints at once */
  animate: boolean;
  greeting: Line[];
}

export function TerminalShell({ animate, greeting }: ShellProps) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(greeting);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const history = useRef<string[]>([]);
  const historyAt = useRef(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Follow the output down, the way a terminal does. Not smooth: a shell that
  // eases into place feels like a web page pretending to be one.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const print = useCallback((next: Line[]) => {
    setLines((current) => [...current, ...next]);
  }, []);

  const submit = useCallback(
    (raw: string) => {
      if (busy) return;
      const entry = raw.trim();

      print([{ kind: "input", text: entry }]);
      if (entry) {
        history.current = [...history.current, entry].slice(-40);
        historyAt.current = -1;
      }
      setValue("");

      const result = run(entry, router);

      if (result === null) {
        setLines([]);
        return;
      }

      if (Array.isArray(result)) {
        print(result);
        return;
      }

      if (!animate) {
        print(result.lines);
        return;
      }

      // Staged output: the point is that a deploy takes time, so the steps
      // arrive at the pace the real thing would report them.
      setBusy(true);
      result.lines.forEach((line, i) => {
        setTimeout(() => {
          print([line]);
          if (i === result.lines.length - 1) setBusy(false);
        }, result.pace * (i + 1));
      });
    },
    [animate, busy, print, router],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      submit(value);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const word = value.trim();
      const match = COMMANDS.find((c) => c.startsWith(word) && c !== word);
      if (match) setValue(match + " ");
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (history.current.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowUp" ? 1 : -1;
      const next = Math.min(
        Math.max(historyAt.current + step, -1),
        history.current.length - 1,
      );
      historyAt.current = next;
      setValue(next < 0 ? "" : history.current[history.current.length - 1 - next]);
    }
  };

  const colour: Record<Line["kind"], string> = {
    input: "text-[#ffd591]",
    output: "text-[#ffb000]",
    muted: "text-[#a8752b]",
    good: "text-[#8ce563]",
    warn: "text-[#ff7a4d]",
  };

  return (
    // Clicking anywhere in the frame focuses the prompt, as clicking a terminal
    // window does. The input keeps its own focus ring for keyboard users.
    <div
      className="flex h-full flex-col"
      onClick={() => input.current?.focus()}
    >
      <div
        ref={scroller}
        className="flex-1 overflow-x-auto overflow-y-auto px-5 py-4 text-[13px] leading-[1.65] sm:px-6"
        // The transcript is a log: announce additions, do not re-read it all.
        aria-live="polite"
        aria-atomic="false"
      >
        {lines.map((line, i) => (
          // whitespace-pre, or HTML collapses the runs of spaces that hold a
          // column together: `status` prints a table, and a terminal that
          // cannot align one is not a terminal
          <div key={i} className={`whitespace-pre ${colour[line.kind]}`}>
            {line.kind === "input" ? (
              <>
                <span className="text-[#8ce563]">$ </span>
                {line.text}
              </>
            ) : (
              line.text || " "
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-5 pb-4 text-[13px] sm:px-6">
        <label htmlFor="ridge-prompt" className="text-[#8ce563]" aria-hidden>
          $
        </label>
        <span className="sr-only" id="ridge-prompt-label">
          {PRODUCT} command line. Type help for the list of commands.
        </span>
        <input
          id="ridge-prompt"
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          aria-labelledby="ridge-prompt-label"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full bg-transparent text-[#ffd591] caret-[#ffb000] outline-none placeholder:text-[#7a5520] focus-visible:outline-none disabled:opacity-50"
          placeholder={busy ? "working…" : "try: deploy"}
        />
      </div>
    </div>
  );
}
