// ─────────────────────────────────────────────────────────────
//  Counts that appear inside copy. The dictionary writes {projects}
//  and {labs}; this fills them in from the data, so a number in a
//  sentence can never drift from the list it describes.
//  (เขียน {projects} / {labs} ใน dictionary.ts แล้วมันเติมเลขให้เอง)
// ─────────────────────────────────────────────────────────────

import { labs } from "./labs";
import { projects } from "./projects";

export function withCounts(copy: string): string {
  return copy
    .replace("{projects}", String(projects.length))
    .replace("{labs}", String(labs.length));
}
