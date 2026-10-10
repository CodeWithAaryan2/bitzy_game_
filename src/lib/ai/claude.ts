// ======================================================
// DEPRECATED — Sub AI is now 100% local (no API calls)
// Kept as stub so old imports don't break the build.
// ======================================================

import type { AIResponse } from "./types";

export async function askClaude(): Promise<AIResponse> {
  return {
    text: "Sub AI now runs fully offline — no external AI calls.",
    confidence: 0,
    source: "bitzy",
  };
}
