import type { AIMode } from "./types";

interface AIRequest {
  message: string;
  mode: AIMode;
  history: { role: string; content: string }[];
  user: {
    name: string;
    level: number;
    xp: number;
    streak: number;
  };
}

interface AIResponse {
  text: string;
  source: "gemini";
  confidence: number;
}

export async function getSmartResponse(
  data: AIRequest
): Promise<AIResponse> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: data.message,
      mode: data.mode,
      history: data.history,
      user: data.user,
    }),
  });

  const result: {
    text?: string;
    source?: string;
    error?: string;
  } = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error || `Sub AI request failed (${response.status}).`
    );
  }

  if (typeof result.text !== "string" || !result.text.trim()) {
    throw new Error("Sub AI returned an empty response.");
  }

  return {
    text: result.text,
    source: "gemini",
    confidence: 0,
  };
}