import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

const DEFAULT_USER_ID = 1;

export const mentorRouter = createRouter({
  chat: publicQuery
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db.from("chatMessages").insert({
        userId: DEFAULT_USER_ID,
        role: "user",
        content: input.message,
      } as any);

      const lowerMsg = input.message.toLowerCase();
      let response = "";

      if (lowerMsg.includes("hello") || lowerMsg.includes("hi ") || lowerMsg === "hi") {
        response = "Hello there! I'm your AI coding mentor. Ask me anything about programming — from basic syntax to advanced algorithms!";
      } else if (lowerMsg.includes("html")) {
        response = "HTML (HyperText Markup Language) is the foundation of web pages. It uses tags to structure content. Key concepts: semantic elements, forms, and accessibility. Would you like to dive deeper into any specific HTML topic?";
      } else if (lowerMsg.includes("css")) {
        response = "CSS controls the visual presentation of web pages. Important topics include: selectors, the box model, Flexbox, Grid, and responsive design with media queries. What would you like to learn about CSS?";
      } else if (lowerMsg.includes("javascript") || lowerMsg.includes("js")) {
        response = "JavaScript is the programming language of the web! Key topics: variables (let/const), functions, arrays, objects, async/await, and DOM manipulation. What JS concept are you struggling with?";
      } else if (lowerMsg.includes("react")) {
        response = "React is a component-based UI library. Core concepts: JSX, props, state (useState), effects (useEffect), hooks, and context. The React course on Bitzy covers all of this! What specifically about React?";
      } else if (lowerMsg.includes("python")) {
        response = "Python is known for its readability and versatility. Great for beginners! Key topics: indentation-based syntax, lists/dicts, list comprehensions, functions, and OOP. Ask me anything about Python!";
      } else if (lowerMsg.includes("array") || lowerMsg.includes("list")) {
        response = "Arrays/lists are ordered collections. In JavaScript: use `map`, `filter`, `reduce`, `find`, `includes`. In Python: list comprehensions, slicing, `append`, `extend`. Need help with a specific array problem?";
      } else if (lowerMsg.includes("function")) {
        response = "Functions are reusable blocks of code. In JS: function declarations, expressions, arrow functions. In Python: `def`, lambda functions, *args/**kwargs. Functions can take other functions as arguments (higher-order functions)!";
      } else if (lowerMsg.includes("loop") || lowerMsg.includes("for") || lowerMsg.includes("while")) {
        response = "Loops repeat code: `for` loops for known iterations, `while` for conditions, `for...of` (JS) / `for...in` (Python) for iterables. Modern approach: use array methods like `map`, `filter`, `forEach` instead of traditional loops when possible.";
      } else if (lowerMsg.includes("algorithm")) {
        response = "Algorithms are step-by-step procedures for solving problems. Start with: sorting (bubble, merge, quick), searching (linear, binary), and recursion. Big O notation helps analyze efficiency. Which algorithm topic interests you?";
      } else if (lowerMsg.includes("debug") || lowerMsg.includes("error")) {
        response = "Debugging tips: 1) Read error messages carefully, 2) Use console.log() or print() to trace values, 3) Check for typos and syntax errors, 4) Use browser DevTools (F12), 5) Isolate the problem by commenting out code, 6) Rubber duck debugging — explain your code line by line!";
      } else if (lowerMsg.includes("help") || lowerMsg.includes("stuck")) {
        response = "I'm here to help! Try breaking your problem into smaller parts. What's the specific concept or error you're dealing with? Share the code snippet and I'll guide you through it.";
      } else if (lowerMsg.includes("thank")) {
        response = "You're welcome! Keep up the great work — consistency is the key to becoming a great developer. Come back anytime you need help!";
      } else {
        response = "That's an interesting question! I'm your AI coding mentor here to help with HTML, CSS, JavaScript, React, Python, algorithms, and general programming concepts. Could you share more details about what you're working on?";
      }

      await db.from("chatMessages").insert({
        userId: DEFAULT_USER_ID,
        role: "assistant",
        content: response,
      } as any);

      return { response };
    }),

  history: publicQuery.query(async () => {
    const db = getDb();
    const { data } = await db
      .from("chatMessages")
      .select("*")
      .eq("userId", DEFAULT_USER_ID)
      .order("createdAt", { ascending: false })
      .limit(50);
    return data ?? [];
  }),

  clearHistory: publicQuery.mutation(async () => {
    const db = getDb();
    await db.from("chatMessages").delete().eq("userId", DEFAULT_USER_ID);
    return { success: true };
  }),
});
