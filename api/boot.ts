import "dotenv/config";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { GoogleGenAI } from "@google/genai";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { registerWebhookRoute } from "./webhook-router";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

registerWebhookRoute(app);

app.post("/api/ai/chat", async (c) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return c.json(
      { error: "Gemini API key is missing from the server environment." },
      503
    );
  }

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON request." }, 400);
  }

  if (!body || typeof body !== "object") {
    return c.json({ error: "Invalid request body." }, 400);
  }

  const request = body as {
    message?: unknown;
    mode?: unknown;
    history?: unknown;
  };

  const message =
    typeof request.message === "string" ? request.message.trim() : "";

  if (!message || message.length > 12000) {
    return c.json(
      { error: "Message must contain between 1 and 12000 characters." },
      400
    );
  }

  const validModes = ["teacher", "debug", "interview", "project"] as const;

  const mode = validModes.includes(
    request.mode as (typeof validModes)[number]
  )
    ? (request.mode as (typeof validModes)[number])
    : "teacher";

  const instructions = {
    teacher:
      "Teach programming step by step. Explain concepts simply and include useful examples.",
    debug:
      "Help debug code. Identify likely causes, provide corrected code, and explain the fix.",
    interview:
      "Act as a friendly coding interviewer. Explain concepts, ask practice questions, and give constructive feedback.",
    project:
      "Help build practical software projects. Explain architecture, implementation steps, and code.",
  };

  const history = Array.isArray(request.history)
    ? request.history
        .filter(
          (
            item
          ): item is { role: string; content: string } =>
            typeof item === "object" &&
            item !== null &&
            "role" in item &&
            "content" in item &&
            ["user", "assistant"].includes(
              String((item as { role: unknown }).role)
            ) &&
            typeof (item as { content: unknown }).content === "string"
        )
        .slice(-12)
        .map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content.slice(0, 6000) }],
        }))
    : [];

  try {
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      history,
      config: {
        systemInstruction: [
          "You are Sub AI, Bitzy's personal coding mentor.",
          instructions[mode],
          "Be accurate, friendly, and practical.",
          "Use Markdown formatting and fenced code blocks for code.",
          "Respond in English or Hinglish based on the learner's language.",
          "Never claim you executed code unless you actually did.",
        ].join("\n\n"),
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage({ message });
    const responseText = result.text?.trim();

    if (!responseText) {
      return c.json(
        { error: "Gemini returned an empty response. Please try again." },
        502
      );
    }

    return c.json({
      text: responseText,
      source: "gemini" as const,
    });
  } catch (error) {
    console.error("Gemini request failed:", error);

    return c.json(
      {
        error:
          "Sub AI could not respond. Check your Gemini API key, model availability, quota, and server logs.",
      },
      502
    );
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");

  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000", 10);

  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}