import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY env vars");
  console.error("Example: SUPABASE_URL=https://your-project.supabase.co SUPABASE_PUBLISHABLE_KEY=your-key npx tsx db/seed.ts");
  process.exit(1);
}

// Node.js < 22 needs explicit WebSocket implementation for Supabase Realtime
let wsTransport: any = undefined;
try {
  wsTransport = (await import("ws")).default;
} catch {
  // ws not available
}

const supabaseOpts: any = {
  auth: { autoRefreshToken: false, persistSession: false },
};
if (wsTransport) {
  supabaseOpts.realtime = { transport: wsTransport };
}

const supabase = createClient(supabaseUrl, supabaseKey, supabaseOpts);

function esc(s: string): string {
  return s.replace(/\$/g, "\\$");
}

async function seed() {
  console.log("Seeding database via Supabase...");

  // -- Courses --
  console.log("Seeding courses...");
  const courseData = [
    { slug: "html-basics", title: "HTML Fundamentals", description: "Master the building blocks of the web with HTML5. Learn semantic markup, forms, media, and accessibility.", longDescription: "HTML is the foundation of every website.", icon: "FileCode", color: "#e34c26", difficulty: "Beginner", category: "Frontend", tags: JSON.stringify(["html", "web", "beginner"]), totalLessons: 15, totalQuizzes: 3, totalChallenges: 5, estimatedHours: 8, xpReward: 500, coinReward: 250, order: 1 },
    { slug: "css-fundamentals", title: "CSS Fundamentals", description: "Style your web pages with CSS. Learn selectors, box model, flexbox, grid, and responsive design.", longDescription: "CSS brings your HTML to life.", icon: "Palette", color: "#264de4", difficulty: "Beginner", category: "Frontend", tags: JSON.stringify(["css", "styling", "web", "beginner"]), totalLessons: 12, totalQuizzes: 3, totalChallenges: 5, estimatedHours: 10, xpReward: 600, coinReward: 300, order: 2 },
    { slug: "javascript-basics", title: "JavaScript Basics", description: "Learn the programming language of the web. Variables, functions, arrays, objects, and DOM manipulation.", longDescription: "JavaScript makes websites interactive.", icon: "Braces", color: "#f7df1e", difficulty: "Beginner", category: "Frontend", tags: JSON.stringify(["javascript", "programming", "web", "beginner"]), totalLessons: 20, totalQuizzes: 5, totalChallenges: 8, estimatedHours: 15, xpReward: 800, coinReward: 400, order: 3 },
    { slug: "react-basics", title: "React Fundamentals", description: "Build modern UIs with React. Components, hooks, state management, and more.", longDescription: "React is the most popular frontend library.", icon: "Atom", color: "#61dafb", difficulty: "Medium", category: "Frontend", tags: JSON.stringify(["react", "frontend", "javascript", "intermediate"]), totalLessons: 18, totalQuizzes: 4, totalChallenges: 6, estimatedHours: 20, xpReward: 1000, coinReward: 500, order: 4 },
    { slug: "python-basics", title: "Python Fundamentals", description: "Learn Python, the most beginner-friendly programming language.", longDescription: "Python is known for its readable syntax and versatility.", icon: "Terminal", color: "#3776ab", difficulty: "Beginner", category: "Backend", tags: JSON.stringify(["python", "programming", "backend", "beginner"]), totalLessons: 20, totalQuizzes: 5, totalChallenges: 8, estimatedHours: 18, xpReward: 800, coinReward: 400, order: 5 },
  ];

  for (const c of courseData) {
    await supabase.from("courses").upsert(c, { onConflict: "slug" });
  }

  // -- Modules --
  console.log("Seeding modules...");
  const { data: allCourses } = await supabase.from("courses").select("id, slug");
  const courseIdMap = new Map((allCourses ?? []).map((c: any) => [c.slug, c.id]));

  const moduleData = [
    { courseSlug: "html-basics", modKey: "1", title: "Introduction to HTML", description: "Learn what HTML is and how it structures web content.", order: 1, xpReward: 50, isBossModule: false },
    { courseSlug: "html-basics", modKey: "2", title: "HTML Forms", description: "Create interactive forms for user input.", order: 2, xpReward: 50, isBossModule: false },
    { courseSlug: "html-basics", modKey: "3", title: "Media & Embedding", description: "Add images, audio, video, and embed content.", order: 3, xpReward: 50, isBossModule: false },
    { courseSlug: "css-fundamentals", modKey: "1", title: "CSS Basics", description: "Learn how to style HTML elements.", order: 1, xpReward: 60, isBossModule: false },
    { courseSlug: "css-fundamentals", modKey: "2", title: "Box Model & Layout", description: "Understand sizing, spacing, and positioning.", order: 2, xpReward: 60, isBossModule: false },
    { courseSlug: "css-fundamentals", modKey: "3", title: "Flexbox & Grid", description: "Master modern CSS layout systems.", order: 3, xpReward: 80, isBossModule: false },
    { courseSlug: "javascript-basics", modKey: "1", title: "Getting Started with JS", description: "Your first steps in JavaScript programming.", order: 1, xpReward: 80, isBossModule: false },
    { courseSlug: "javascript-basics", modKey: "2", title: "Control Flow & Functions", description: "Conditionals, loops, and reusable code.", order: 2, xpReward: 80, isBossModule: false },
    { courseSlug: "javascript-basics", modKey: "3", title: "Arrays & Objects", description: "Working with data structures in JS.", order: 3, xpReward: 100, isBossModule: false },
    { courseSlug: "react-basics", modKey: "1", title: "Getting Started with React", description: "Learn the basics of React components.", order: 1, xpReward: 100, isBossModule: false },
    { courseSlug: "react-basics", modKey: "2", title: "Hooks & State", description: "Manage state and side effects in React.", order: 2, xpReward: 100, isBossModule: false },
    { courseSlug: "react-basics", modKey: "3", title: "Advanced Patterns", description: "Context, refs, and performance optimization.", order: 3, xpReward: 120, isBossModule: true },
    { courseSlug: "python-basics", modKey: "1", title: "Introduction to Python", description: "Your first Python programs.", order: 1, xpReward: 80, isBossModule: false },
    { courseSlug: "python-basics", modKey: "2", title: "Data Structures", description: "Lists, dictionaries, tuples, and sets.", order: 2, xpReward: 80, isBossModule: false },
    { courseSlug: "python-basics", modKey: "3", title: "Functions & OOP", description: "Reusable code and object-oriented programming.", order: 3, xpReward: 100, isBossModule: false },
  ];

  const insertedModules: Array<{ modKey: string; courseSlug: string; id: number }> = [];
  for (const m of moduleData) {
    const courseId = courseIdMap.get(m.courseSlug);
    if (!courseId) continue;
    const { data, error } = await supabase.from("modules").insert({
      courseId,
      title: m.title,
      description: m.description,
      order: m.order,
      xpReward: m.xpReward,
      isBossModule: m.isBossModule,
    }).select("id");
    if (data && data[0]) {
      insertedModules.push({ modKey: m.modKey, courseSlug: m.courseSlug, id: data[0].id });
    }
  }

  // -- Lessons --
  console.log("Seeding lessons...");
  const moduleIdMap = new Map(insertedModules.map(m => [`${m.courseSlug}-${m.modKey}`, m.id]));

  const lessonData = [
    { courseSlug: "html-basics", moduleKey: "1", title: "What is HTML?", slug: "what-is-html", description: "Understanding the foundation of the web.", content: esc("HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.\n\n## Why Learn HTML?\n\nHTML is the **foundation** of web development. Every website you visit uses HTML.\n\n## Your First HTML Document\n\n```html\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>My First Page</title>\n  </head>\n  <body>\n    <h1>Hello, World!</h1>\n  </body>\n</html>\n```"), codeExamples: JSON.stringify([{ language: "html", code: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>", explanation: "Basic HTML document structure" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 10, order: 1 },
    { courseSlug: "html-basics", moduleKey: "1", title: "Common HTML Elements", slug: "common-elements", description: "Learn the most used HTML tags.", content: esc("HTML provides a rich set of elements for structuring content.\n\n## Headings\n```html\n<h1>Main Title</h1>\n<h2>Section Heading</h2>\n<h3>Subsection</h3>\n```\n\n## Paragraphs and Links\n```html\n<p>This is a paragraph.</p>\n<a href=\"https://example.com\">Click me!</a>\n```\n\n## Lists\n```html\n<ul>\n  <li>Apples</li>\n  <li>Bananas</li>\n</ul>\n```"), codeExamples: JSON.stringify([{ language: "html", code: "<h1>Welcome</h1>\n<p>Learn <strong>HTML</strong> today!</p>\n<ul>\n  <li>Easy to learn</li>\n  <li>Fun to use</li>\n</ul>", explanation: "Common HTML elements" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 12, order: 2 },
    { courseSlug: "html-basics", moduleKey: "1", title: "Semantic HTML", slug: "semantic-html", description: "Write meaningful and accessible markup.", content: esc("Semantic HTML uses elements that convey meaning about the content they contain.\n\n## Common Semantic Elements\n```html\n<header>Site header</header>\n<nav>Navigation</nav>\n<main>Main content</main>\n<article>Self-contained content</article>\n<section>Thematic grouping</section>\n<aside>Sidebar</aside>\n<footer>Footer</footer>\n```\n\nSemantic HTML improves **accessibility**, **SEO**, and **maintainability**."), codeExamples: JSON.stringify([{ language: "html", code: "<article>\n  <header>\n    <h2>Article Title</h2>\n  </header>\n  <p>Article content...</p>\n</article>", explanation: "Semantic article structure" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 10, order: 3 },
    { courseSlug: "html-basics", moduleKey: "2", title: "Form Basics", slug: "form-basics", description: "Learn to create forms with various input types.", content: esc("HTML forms collect user input.\n\n## The Form Element\n```html\n<form action=\"/submit\" method=\"POST\">\n  <!-- controls -->\n</form>\n```\n\n## Input Types\n```html\n<input type=\"text\" placeholder=\"Enter name\">\n<input type=\"email\" placeholder=\"your@email.com\">\n<input type=\"password\">\n<input type=\"number\" min=\"0\" max=\"100\">\n<button type=\"submit\">Submit</button>\n```"), codeExamples: JSON.stringify([{ language: "html", code: "<form>\n  <label>Email:</label>\n  <input type=\"email\" required>\n  <button type=\"submit\">Submit</button>\n</form>", explanation: "Simple form with validation" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 12, order: 1 },
    { courseSlug: "html-basics", moduleKey: "3", title: "Images & Media", slug: "images-media", description: "Add visual content to your pages.", content: esc("The `<img>` tag embeds images.\n\n```html\n<img src=\"photo.jpg\" alt=\"Description\" width=\"300\">\n```\n\nThe `alt` attribute is crucial for **accessibility** and **SEO**.\n\n## Audio & Video\n```html\n<audio controls src=\"music.mp3\"></audio>\n<video controls width=\"400\">\n  <source src=\"movie.mp4\" type=\"video/mp4\">\n</video>\n```"), codeExamples: JSON.stringify([{ language: "html", code: "<img src=\"avatar.jpg\" alt=\"User avatar\" width=\"100\">\n<audio controls src=\"podcast.mp3\"></audio>", explanation: "Media elements" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 10, order: 1 },
    { courseSlug: "css-fundamentals", moduleKey: "1", title: "Introduction to CSS", slug: "intro-to-css", description: "What is CSS and how does it work?", content: esc("CSS (Cascading Style Sheets) styles HTML documents.\n\n## Ways to Add CSS\n1. **External** (recommended): `<link rel=\"stylesheet\" href=\"styles.css\">`\n2. **Internal**: `<style>` tag in `<head>`\n3. **Inline**: `style=\"...\"` attribute\n\n## Basic Syntax\n```css\nselector {\n  property: value;\n}\n\nh1 {\n  color: blue;\n  font-size: 24px;\n}\n```"), codeExamples: JSON.stringify([{ language: "css", code: "h1 {\n  color: #6366f1;\n  font-size: 32px;\n}\n\np {\n  color: #666;\n  line-height: 1.6;\n}", explanation: "Basic CSS styling" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 10, order: 1 },
    { courseSlug: "css-fundamentals", moduleKey: "1", title: "CSS Selectors", slug: "css-selectors", description: "Target elements with precision.", content: esc("Selectors let you target specific elements.\n\n## Basic Selectors\n```css\np { color: red; }        /* element */\n.highlight { bg: yellow; } /* class */\n#header { font-size: 24px; } /* id */\n```\n\n## Combinators\n```css\nnav a { color: blue; }    /* descendant */\nul > li { list-style: square; } /* child */\nh2 + p { margin-top: 0; } /* adjacent sibling */\n```"), codeExamples: JSON.stringify([{ language: "css", code: "button:hover {\n  background: #6366f1;\n  transform: scale(1.05);\n}\n\ninput:focus {\n  border-color: #22d3ee;\n}", explanation: "Interactive states" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 12, order: 2 },
    { courseSlug: "css-fundamentals", moduleKey: "2", title: "The Box Model", slug: "box-model", description: "Understand how element sizing works.", content: esc("Every HTML element is a box with: **content**, **padding**, **border**, and **margin**.\n\n```css\n/* Border box (recommended) */\n*, *::before, *::after {\n  box-sizing: border-box;\n}\n```\n\n## Shorthand\n```css\nmargin: 10px 20px 15px 25px; /* T R B L */\npadding: 20px; /* all sides */\nborder: 2px solid #6366f1;\nborder-radius: 8px;\n```"), codeExamples: JSON.stringify([{ language: "css", code: ".card {\n  width: 300px;\n  padding: 20px;\n  border: 1px solid #ddd;\n  border-radius: 12px;\n  margin: 10px auto;\n}", explanation: "Card component with box model" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 10, order: 1 },
    { courseSlug: "css-fundamentals", moduleKey: "3", title: "Flexbox Layout", slug: "flexbox", description: "One-dimensional layout system.", content: esc("Flexbox arranges items in a row or column.\n\n## Container Properties\n```css\n.container {\n  display: flex;\n  justify-content: center; /* horizontal */\n  align-items: center;     /* vertical */\n  gap: 16px;\n  flex-wrap: wrap;\n}\n```\n\n## Item Properties\n```css\n.item {\n  flex: 1;        /* grow to fill */\n  flex-shrink: 0; /* don't shrink */\n}\n```"), codeExamples: JSON.stringify([{ language: "css", code: ".navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem;\n}", explanation: "Flexbox navbar" }]), type: "reading", xpReward: 25, coinReward: 12, energyCost: 5, estimatedMinutes: 15, order: 1 },
    { courseSlug: "javascript-basics", moduleKey: "1", title: "What is JavaScript?", slug: "what-is-javascript", description: "The programming language of the web.", content: esc("JavaScript brings websites to life. It runs in every browser.\n\n## Variables\n```javascript\nlet age = 25;          // can reassign\nconst PI = 3.14159;   // cannot reassign\n```\n\n## Data Types\n```javascript\nlet userName = \"Alice\";   // String\nlet count = 42;       // Number\nlet active = true;    // Boolean\nlet items = [1,2,3];  // Array\nlet user = { name: \"A\" }; // Object\n```\n\n**Best practice**: Use `const` by default, `let` when needed."), codeExamples: JSON.stringify([{ language: "javascript", code: 'let name = "Bitxy";\nconst year = 2024;\nconsole.log(`Learning JS in ${"year"}`);', explanation: "Variables and template literals" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 12, order: 1 },
    { courseSlug: "javascript-basics", moduleKey: "1", title: "Functions", slug: "functions", description: "Reusable blocks of code.", content: esc("Functions perform specific tasks.\n\n## Declaration\n```javascript\nfunction greet(name) {\n  return \"Hello, \" + name + \"!\";\n}\n```\n\n## Arrow Functions\n```javascript\nconst multiply = (a, b) => a * b;\nconst square = x => x * x;\n```\n\n## Higher-Order Functions\nFunctions that take or return other functions."), codeExamples: JSON.stringify([{ language: "javascript", code: "const calculate = (a, b, op) => {\n  if (op === 'add') return a + b;\n  if (op === 'multiply') return a * b;\n  return 0;\n};\nconsole.log(calculate(5, 3, 'add')); // 8", explanation: "Function with conditionals" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 12, order: 2 },
    { courseSlug: "javascript-basics", moduleKey: "2", title: "Conditionals & Loops", slug: "conditionals-loops", description: "Control the flow of your program.", content: esc("Make decisions and repeat actions.\n\n## If/Else\n```javascript\nif (score >= 90) {\n  console.log(\"A\");\n} else if (score >= 80) {\n  console.log(\"B\");\n} else {\n  console.log(\"C\");\n}\n```\n\n## Loops\n```javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\nconst fruits = [\"a\", \"b\", \"c\"];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}\n```"), codeExamples: JSON.stringify([{ language: "javascript", code: "const nums = [1, 2, 3, 4, 5];\nconst evens = [];\nfor (const n of nums) {\n  if (n % 2 === 0) evens.push(n);\n}\nconsole.log(evens); // [2, 4]", explanation: "Loop with conditional" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 12, order: 1 },
    { courseSlug: "javascript-basics", moduleKey: "3", title: "Arrays Deep Dive", slug: "arrays-deep", description: "Master array methods.", content: esc("Arrays are ordered collections with powerful methods.\n\n```javascript\nconst nums = [1, 2, 3, 4, 5];\n\nconst doubled = nums.map(n => n * 2);      // [2,4,6,8,10]\nconst evens = nums.filter(n => n % 2 === 0); // [2,4]\nconst sum = nums.reduce((a, b) => a + b, 0); // 15\nconst first = nums.find(n => n > 2);       // 3\n\n// Chaining\nconst result = nums\n  .filter(n => n % 2 === 0)\n  .map(n => n * n)\n  .reduce((a, b) => a + b, 0); // 20\n```"), codeExamples: JSON.stringify([{ language: "javascript", code: "const users = [\n  { name: 'Alice', age: 25 },\n  { name: 'Bob', age: 30 }\n];\nconst names = users.map(u => u.name);\nconst adults = users.filter(u => u.age >= 25);\nconsole.log(names); // ['Alice', 'Bob']", explanation: "Practical array methods" }]), type: "reading", xpReward: 25, coinReward: 12, energyCost: 5, estimatedMinutes: 15, order: 1 },
    { courseSlug: "react-basics", moduleKey: "1", title: "What is React?", slug: "what-is-react", description: "Introduction to the React library.", content: esc("React is a JavaScript library for building user interfaces.\n\n## JSX\nWrite HTML-like code in JavaScript:\n```jsx\nfunction Welcome() {\n  return <h1>Hello, World!</h1>;\n}\n```\n\n## Components\n```jsx\nfunction Button({ text, onClick }) {\n  return <button onClick={onClick}>{text}</button>;\n}\n```\n\n## Props\nPass data to components as attributes."), codeExamples: JSON.stringify([{ language: "jsx", code: "function Card({ title, children }) {\n  return (\n    <div className=\"card\">\n      <h2>{title}</h2>\n      <div>{children}</div>\n    </div>\n  );\n}\n\n<Card title=\"Welcome\">\n  <p>Card content!</p>\n</Card>", explanation: "Reusable card component" }]), type: "reading", xpReward: 25, coinReward: 12, energyCost: 5, estimatedMinutes: 15, order: 1 },
    { courseSlug: "react-basics", moduleKey: "2", title: "useState Hook", slug: "usestate-hook", description: "Manage component state.", content: esc("State lets components remember information.\n\n```jsx\nimport { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n```\n\nState changes trigger re-renders. Always use the setter function!"), codeExamples: JSON.stringify([{ language: "jsx", code: "function Form() {\n  const [name, setName] = useState('');\n\n  return (\n    <input\n      value={name}\n      onChange={e => setName(e.target.value)}\n      placeholder=\"Enter name\"\n    />\n  );\n}", explanation: "Controlled input with state" }]), type: "reading", xpReward: 25, coinReward: 12, energyCost: 5, estimatedMinutes: 15, order: 1 },
    { courseSlug: "python-basics", moduleKey: "1", title: "Hello, Python!", slug: "hello-python", description: "Write your first Python program.", content: esc("Python is a high-level, interpreted language known for simplicity.\n\n## Your First Program\n```python\nprint(\"Hello, World!\")\nname = \"Alice\"\nprint(f\"Hello, {name}!\")\n```\n\n## Data Types\n```python\ntext = \"Hello\"        # String\ncount = 42            # Integer\nprice = 19.99         # Float\nactive = True         # Boolean\nfruits = [\"a\", \"b\"]   # List\nperson = {\"name\": \"A\"} # Dict\n```"), codeExamples: JSON.stringify([{ language: "python", code: 'name = "Bitxy Learner"\nage = 20\nprint(f"Welcome, {name}!")\nbirth_year = 2024 - age\nprint(f"Born in {birth_year}")', explanation: "Python basics with f-strings" }]), type: "reading", xpReward: 20, coinReward: 10, energyCost: 5, estimatedMinutes: 10, order: 1 },
  ];

  for (const l of lessonData) {
    const courseId = courseIdMap.get(l.courseSlug);
    const moduleId = moduleIdMap.get(`${l.courseSlug}-${l.moduleKey}`);
    if (!courseId || !moduleId) continue;
    await supabase.from("lessons").insert({
      courseId,
      moduleId,
      title: l.title,
      slug: l.slug,
      description: l.description,
      content: l.content,
      codeExamples: l.codeExamples,
      type: l.type,
      xpReward: l.xpReward,
      coinReward: l.coinReward,
      energyCost: l.energyCost,
      estimatedMinutes: l.estimatedMinutes,
      order: l.order,
    });
  }

  // -- Quizzes --
  console.log("Seeding quizzes...");
  const quizData = [
    { courseSlug: "html-basics", title: "HTML Basics Quiz", description: "Test your HTML knowledge", questions: JSON.stringify([{ id: "q1", type: "multiple_choice", question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctAnswer: 0, explanation: "HTML = HyperText Markup Language", difficulty: "easy" }, { id: "q2", type: "multiple_choice", question: "Which tag creates a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], correctAnswer: 1, explanation: "The <a> tag creates links", difficulty: "easy" }, { id: "q3", type: "multiple_choice", question: "Which tag is self-closing?", options: ["<div>", "<p>", "<img>", "<span>"], correctAnswer: 2, explanation: "<img> is self-closing", difficulty: "easy" }]), passingScore: 70, xpReward: 50, coinReward: 25 },
    { courseSlug: "css-fundamentals", title: "CSS Fundamentals Quiz", description: "Test your CSS knowledge", questions: JSON.stringify([{ id: "q1", type: "multiple_choice", question: "Which property changes text color?", options: ["text-color", "font-color", "color", "text-style"], correctAnswer: 2, explanation: "The 'color' property sets text color", difficulty: "easy" }, { id: "q2", type: "multiple_choice", question: "What does box-sizing: border-box do?", options: ["Includes padding and border in width", "Adds a box around the element", "Creates a flex container", "Sets element to display:block"], correctAnswer: 0, explanation: "border-box includes padding and border in the element's total width", difficulty: "medium" }]), passingScore: 70, xpReward: 50, coinReward: 25 },
    { courseSlug: "javascript-basics", title: "JavaScript Basics Quiz", description: "Test your JS knowledge", questions: JSON.stringify([{ id: "q1", type: "multiple_choice", question: "Which declares a constant variable?", options: ["var", "let", "const", "static"], correctAnswer: 2, explanation: "const declares a constant", difficulty: "easy" }, { id: "q2", type: "multiple_choice", question: "What is the output of [1,2,3].map(n => n * 2)?", options: ["[1,2,3]", "[2,4,6]", "[1,4,9]", "undefined"], correctAnswer: 1, explanation: "map transforms each element", difficulty: "easy" }, { id: "q3", type: "multiple_choice", question: "Which is NOT a JavaScript data type?", options: ["Number", "String", "Float", "Boolean"], correctAnswer: 2, explanation: "JavaScript has Number, not Float", difficulty: "medium" }]), passingScore: 70, xpReward: 50, coinReward: 25 },
    { courseSlug: "react-basics", title: "React Fundamentals Quiz", description: "Test your React knowledge", questions: JSON.stringify([{ id: "q1", type: "multiple_choice", question: "What is JSX?", options: ["A JavaScript syntax extension", "A CSS framework", "A database query language", "A testing library"], correctAnswer: 0, explanation: "JSX is a JavaScript syntax extension", difficulty: "easy" }, { id: "q2", type: "multiple_choice", question: "Which hook manages state?", options: ["useEffect", "useState", "useContext", "useReducer"], correctAnswer: 1, explanation: "useState manages component state", difficulty: "easy" }]), passingScore: 70, xpReward: 50, coinReward: 25 },
    { courseSlug: "python-basics", title: "Python Basics Quiz", description: "Test your Python knowledge", questions: JSON.stringify([{ id: "q1", type: "multiple_choice", question: "Which function prints output?", options: ["echo()", "print()", "console.log()", "printf()"], correctAnswer: 1, explanation: "Python uses print()", difficulty: "easy" }, { id: "q2", type: "multiple_choice", question: "How do you create a list in Python?", options: ["[]", "{}", "()", "<>"], correctAnswer: 0, explanation: "Lists use square brackets []", difficulty: "easy" }, { id: "q3", type: "multiple_choice", question: "What is a correct f-string?", options: ['f"Hello {name}"', '"Hello {name}"', "f'Hello', '{name}'", 'f(Hello {name})'], correctAnswer: 0, explanation: "f-strings use the f prefix", difficulty: "easy" }]), passingScore: 70, xpReward: 50, coinReward: 25 },
  ];

  for (const q of quizData) {
    const courseId = courseIdMap.get(q.courseSlug);
    if (!courseId) continue;
    const { data: courseLessons } = await supabase.from("lessons").select("id").eq("courseId", courseId).limit(1);
    await supabase.from("quizzes").insert({
      courseId,
      lessonId: courseLessons?.[0]?.id ?? 1,
      title: q.title,
      description: q.description,
      questions: q.questions,
      passingScore: q.passingScore,
      xpReward: q.xpReward,
      coinReward: q.coinReward,
    });
  }

  // -- Challenges --
  console.log("Seeding challenges...");
  const challengeData = [
    { title: "Two Sum", slug: "two-sum", description: "Given an array of integers and a target, return indices of two numbers that add up to target.", difficulty: "Easy", category: "Arrays", problemStatement: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.", constraints: "- 2 <= nums.length <= 10^4\n- Only one valid answer exists.", examples: JSON.stringify([{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9" }]), starterCode: JSON.stringify({ javascript: "function twoSum(nums, target) {\n  // Your code here\n  \n}", python: "def two_sum(nums, target):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Consider using a hash map to store numbers you've seen.", order: 1, xpCost: 5 }, { id: "2", hintText: "For each number, check if (target - current) exists in the map.", order: 2, xpCost: 10 }]), testCases: JSON.stringify([{ id: "1", input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false, isExample: true }, { id: "2", input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false, isExample: true }, { id: "3", input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true, isExample: false }]), xpReward: 50, coinReward: 25, solveCount: 12453, attemptCount: 28764 },
    { title: "Reverse a String", slug: "reverse-string", description: "Write a function that reverses a string.", difficulty: "Easy", category: "Strings", problemStatement: "Write a function that reverses a string.", constraints: "- 1 <= s.length <= 10^5", examples: JSON.stringify([{ input: 's = "hello"', output: '"olleh"', explanation: "The reverse of 'hello'" }]), starterCode: JSON.stringify({ javascript: "function reverseString(s) {\n  // Your code here\n  \n}", python: "def reverse_string(s):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Use two pointers at start and end, swap and move inward.", order: 1, xpCost: 5 }]), testCases: JSON.stringify([{ id: "1", input: '"hello"', expectedOutput: '"olleh"', isHidden: false, isExample: true }, { id: "2", input: '"A"', expectedOutput: '"A"', isHidden: true, isExample: false }]), xpReward: 40, coinReward: 20, solveCount: 9823, attemptCount: 15432 },
    { title: "Fizz Buzz", slug: "fizz-buzz", description: "The classic programming interview question.", difficulty: "Easy", category: "Numbers", problemStatement: "Given n, return array where multiples of 3 are 'Fizz', 5 are 'Buzz', both are 'FizzBuzz'.", constraints: "- 1 <= n <= 10^4", examples: JSON.stringify([{ input: "n = 3", output: '["1","2","Fizz"]', explanation: "3 is divisible by 3" }]), starterCode: JSON.stringify({ javascript: "function fizzBuzz(n) {\n  // Your code here\n  \n}", python: "def fizz_buzz(n):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Use the modulo operator % to check divisibility.", order: 1, xpCost: 5 }]), testCases: JSON.stringify([{ id: "1", input: "3", expectedOutput: '["1","2","Fizz"]', isHidden: false, isExample: true }]), xpReward: 35, coinReward: 18, solveCount: 15234, attemptCount: 19876 },
    { title: "Valid Palindrome", slug: "valid-palindrome", description: "Check if a string is a palindrome.", difficulty: "Easy", category: "Strings", problemStatement: "Given a string s, return true if it is a palindrome, or false otherwise.", constraints: "- 1 <= s.length <= 2 * 10^5", examples: JSON.stringify([{ input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome' }]), starterCode: JSON.stringify({ javascript: "function isPalindrome(s) {\n  // Your code here\n  \n}", python: "def is_palindrome(s):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Filter non-alphanumeric and convert to lowercase first.", order: 1, xpCost: 5 }]), testCases: JSON.stringify([{ id: "1", input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false, isExample: true }]), xpReward: 45, coinReward: 22, solveCount: 11234, attemptCount: 18765 },
    { title: "Binary Search", slug: "binary-search", description: "Search for a target in a sorted array.", difficulty: "Medium", category: "Algorithms", problemStatement: "Given a sorted array and a target, return the index of target. Return -1 if not found. Must be O(log n).", constraints: "- 1 <= nums.length <= 10^4", examples: JSON.stringify([{ input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 is at index 4" }]), starterCode: JSON.stringify({ javascript: "function search(nums, target) {\n  // Your code here\n  \n}", python: "def search(nums, target):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Divide the search interval in half repeatedly.", order: 1, xpCost: 10 }]), testCases: JSON.stringify([{ id: "1", input: "[-1,0,3,5,9,12]\n9", expectedOutput: "4", isHidden: false, isExample: true }]), xpReward: 100, coinReward: 50, solveCount: 8234, attemptCount: 14235 },
    { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", description: "Merge two sorted linked lists.", difficulty: "Medium", category: "Data Structures", problemStatement: "Merge two sorted linked lists and return a new sorted list.", constraints: "- Number of nodes: [0, 50]", examples: JSON.stringify([{ input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "Merged sorted list" }]), starterCode: JSON.stringify({ javascript: "function mergeTwoLists(list1, list2) {\n  // Your code here\n  \n}", python: "def merge_two_lists(list1, list2):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Compare heads, take smaller, attach result of merging rest.", order: 1, xpCost: 10 }]), testCases: JSON.stringify([{ id: "1", input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false, isExample: true }]), xpReward: 100, coinReward: 50, solveCount: 6234, attemptCount: 11235 },
    { title: "Longest Substring", slug: "longest-substring", description: "Find length of longest substring without repeating characters.", difficulty: "Medium", category: "Strings", problemStatement: "Given a string s, find the length of the longest substring without repeating characters.", constraints: "- 0 <= s.length <= 5 * 10^4", examples: JSON.stringify([{ input: 's = "abcabcbb"', output: "3", explanation: '"abc" has length 3' }]), starterCode: JSON.stringify({ javascript: "function lengthOfLongestSubstring(s) {\n  // Your code here\n  \n}", python: "def length_of_longest_substring(s):\n    # Your code here\n    pass" }), hints: JSON.stringify([{ id: "1", hintText: "Use a sliding window with a Set to track characters.", order: 1, xpCost: 10 }]), testCases: JSON.stringify([{ id: "1", input: '"abcabcbb"', expectedOutput: "3", isHidden: false, isExample: true }]), xpReward: 120, coinReward: 60, solveCount: 5234, attemptCount: 10235 },
  ];

  for (const c of challengeData) {
    await supabase.from("challenges").upsert(c, { onConflict: "slug" });
  }

  // -- Achievements --
  console.log("Seeding achievements...");
  const achievementData = [
    { name: "first_steps", title: "First Steps", description: "Complete your first lesson.", category: "learning", icon: "Footprints", color: "#22c55e", requirementType: "lessons_completed", requirementCount: 1, xpReward: 50, coinReward: 25, isSecret: false },
    { name: "dedicated_learner", title: "Dedicated Learner", description: "Complete 10 lessons.", category: "learning", icon: "BookOpen", color: "#3b82f6", requirementType: "lessons_completed", requirementCount: 10, xpReward: 200, coinReward: 100, isSecret: false },
    { name: "knowledge_seeker", title: "Knowledge Seeker", description: "Complete 50 lessons.", category: "learning", icon: "GraduationCap", color: "#8b5cf6", requirementType: "lessons_completed", requirementCount: 50, xpReward: 500, coinReward: 250, isSecret: false },
    { name: "quiz_master", title: "Quiz Master", description: "Complete 5 quizzes.", category: "learning", icon: "Target", color: "#f59e0b", requirementType: "quizzes_completed", requirementCount: 5, xpReward: 150, coinReward: 75, isSecret: false },
    { name: "quiz_champion", title: "Quiz Champion", description: "Complete 20 quizzes.", category: "learning", icon: "Trophy", color: "#ef4444", requirementType: "quizzes_completed", requirementCount: 20, xpReward: 400, coinReward: 200, isSecret: false },
    { name: "code_newbie", title: "Code Newbie", description: "Solve your first challenge.", category: "coding", icon: "Code", color: "#10b981", requirementType: "challenges_solved", requirementCount: 1, xpReward: 75, coinReward: 40, isSecret: false },
    { name: "problem_solver", title: "Problem Solver", description: "Solve 10 challenges.", category: "coding", icon: "Brain", color: "#6366f1", requirementType: "challenges_solved", requirementCount: 10, xpReward: 300, coinReward: 150, isSecret: false },
    { name: "algorithm_expert", title: "Algorithm Expert", description: "Solve 50 challenges.", category: "coding", icon: "Cpu", color: "#ec4899", requirementType: "challenges_solved", requirementCount: 50, xpReward: 1000, coinReward: 500, isSecret: false },
    { name: "streak_3", title: "Getting Warm", description: "Maintain a 3-day streak.", category: "streak", icon: "Flame", color: "#f97316", requirementType: "streak_days", requirementCount: 3, xpReward: 100, coinReward: 50, isSecret: false },
    { name: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak.", category: "streak", icon: "Flame", color: "#ef4444", requirementType: "streak_days", requirementCount: 7, xpReward: 250, coinReward: 125, isSecret: false },
    { name: "streak_30", title: "Monthly Master", description: "Maintain a 30-day streak.", category: "streak", icon: "Crown", color: "#eab308", requirementType: "streak_days", requirementCount: 30, xpReward: 1000, coinReward: 500, isSecret: false },
    { name: "course_finisher", title: "Course Finisher", description: "Complete your first course.", category: "course", icon: "CheckCircle", color: "#22c55e", requirementType: "course_completed", requirementCount: 1, xpReward: 300, coinReward: 150, isSecret: false },
    { name: "course_collector", title: "Course Collector", description: "Complete 3 courses.", category: "course", icon: "Library", color: "#3b82f6", requirementType: "course_completed", requirementCount: 3, xpReward: 800, coinReward: 400, isSecret: false },
    { name: "quest_hunter", title: "Quest Hunter", description: "Complete 10 daily quests.", category: "special", icon: "Sword", color: "#a855f7", requirementType: "quests_completed", requirementCount: 10, xpReward: 200, coinReward: 100, isSecret: false },
    { name: "profile_ready", title: "Profile Ready", description: "Complete your profile with display name and bio.", category: "social", icon: "User", color: "#64748b", requirementType: "profile_complete", requirementCount: 1, xpReward: 50, coinReward: 25, isSecret: false },
    { name: "html_hero", title: "HTML Hero", description: "Complete all HTML lessons.", category: "course", icon: "FileCode", color: "#e34c26", requirementType: "lessons_completed", requirementCount: 15, xpReward: 200, coinReward: 100, isSecret: false },
    { name: "js_ninja", title: "JS Ninja", description: "Complete all JavaScript lessons.", category: "course", icon: "Braces", color: "#f7df1e", requirementType: "lessons_completed", requirementCount: 20, xpReward: 300, coinReward: 150, isSecret: false },
    { name: "secret_legend", title: "Legendary Coder", description: "A hidden achievement for dedicated learners.", category: "secret", icon: "Star", color: "#f59e0b", requirementType: "lessons_completed", requirementCount: 100, xpReward: 2000, coinReward: 1000, isSecret: true },
  ];

  for (const a of achievementData) {
    await supabase.from("achievements").upsert(a, { onConflict: "name" });
  }

  // -- Daily Quests --
  console.log("Seeding daily quests...");
  const questData = [
    { title: "Complete 2 Lessons", description: "Finish 2 lessons today.", questType: "complete_lessons", requirement: 2, xpReward: 50, coinReward: 25, difficulty: "Easy", icon: "BookOpen" },
    { title: "Solve 1 Challenge", description: "Complete a coding challenge today.", questType: "solve_challenges", requirement: 1, xpReward: 75, coinReward: 40, difficulty: "Medium", icon: "Code" },
    { title: "Score 80%+ on Quiz", description: "Take a quiz and score at least 80%.", questType: "quiz_score", requirement: 80, xpReward: 60, coinReward: 30, difficulty: "Medium", icon: "Target" },
    { title: "Earn 100 XP", description: "Accumulate 100 XP through any activities.", questType: "earn_xp", requirement: 100, xpReward: 40, coinReward: 20, difficulty: "Easy", icon: "Zap" },
    { title: "Chat with AI Mentor", description: "Have a conversation with the AI Mentor.", questType: "ai_chat", requirement: 1, xpReward: 30, coinReward: 15, difficulty: "Easy", icon: "MessageCircle" },
    { title: "Complete 5 Lessons", description: "Finish 5 lessons today.", questType: "complete_lessons", requirement: 5, xpReward: 100, coinReward: 50, difficulty: "Hard", icon: "BookOpen" },
    { title: "Solve 3 Challenges", description: "Complete 3 coding challenges today.", questType: "solve_challenges", requirement: 3, xpReward: 150, coinReward: 75, difficulty: "Hard", icon: "Code" },
    { title: "Earn 250 XP", description: "Accumulate 250 XP through any activities.", questType: "earn_xp", requirement: 250, xpReward: 80, coinReward: 40, difficulty: "Medium", icon: "Zap" },
  ];

  for (const q of questData) {
    await supabase.from("dailyQuests").insert(q);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
