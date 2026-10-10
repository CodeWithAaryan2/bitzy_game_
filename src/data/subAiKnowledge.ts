// Sub AI Knowledge Base — fully offline, rule-based responses
// No external API calls. Match user questions to topics and return canned, app-aware answers.

export interface KBEntry {
  keywords: string[];
  response: (ctx: SubAIContext) => string;
}

export interface SubAIContext {
  name: string;
  level: number;
  xp: number;
  coins: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  lessonsCompleted: number;
  challengesSolved: number;
}

// --- helper code snippets ---
const CODE = {
  jsClosure: `\`\`\`javascript
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`
The inner function "closes over" \`count\`, remembering it between calls.`,

  jsArrayMethods: `\`\`\`javascript
const nums = [1, 2, 3, 4, 5];

const doubled = nums.map(n => n * 2);      // [2,4,6,8,10]
const evens   = nums.filter(n => n % 2 === 0); // [2,4]
const total   = nums.reduce((a, b) => a + b, 0); // 15
\`\`\``,

  reactState: `\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`
\`useState\` returns the current value and a setter function. Calling the setter triggers a re-render.`,

  reactEffect: `\`\`\`jsx
import { useEffect, useState } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id); // cleanup
  }, []); // empty deps = run once

  return <p>{seconds}s elapsed</p>;
}
\`\`\``,

  pythonBasics: `\`\`\`python
# Variables & types
name = "Bitzy"
age = 5
is_fun = True

# Loop
for i in range(3):
    print(f"Round {i}")

# Function
def greet(name):
    return f"Hello, {name}!"

print(greet("Learner"))
\`\`\``,

  cssFlexbox: `\`\`\`css
.container {
  display: flex;
  justify-content: center; /* horizontal */
  align-items: center;     /* vertical */
  gap: 1rem;
}
\`\`\`
Flexbox arranges children in a row (default) or column, with easy alignment and spacing.`,

  htmlStructure: `\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
\`\`\`
Every HTML page needs a DOCTYPE, html, head (metadata) and body (visible content).`,

  sqlJoin: `\`\`\`sql
SELECT users.name, orders.total
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.total > 100;
\`\`\`
JOIN combines rows from two tables based on a related column.`,

  gitBasics: `\`\`\`bash
git init                  # start a repo
git add .                 # stage changes
git commit -m "message"   # save a snapshot
git push origin main      # upload to GitHub
git pull                  # download latest changes
\`\`\``,

  tsInterface: `\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string; // optional
}

function greet(user: User): string {
  return \`Hello, \${user.name}\`;
}
\`\`\``,

  dataStructureArray: `\`\`\`javascript
// Array - O(1) access, O(n) search
const arr = [10, 20, 30];

// Linked List node
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
\`\`\`
Arrays = fast random access. Linked lists = fast insertion/deletion at ends.`,
};

export const knowledgeBase: KBEntry[] = [
  // ===== APP NAVIGATION / FEATURES =====
  {
    keywords: ['xp', 'earn xp', 'gain xp', 'experience point', 'level up', 'how to level'],
    response: (ctx) => `**Earning XP in Bitzy** ⚡\n\n• Complete a lesson → **+25 XP** + 10 gems\n• Pass a quiz → up to **+50 XP** + 15 gems\n• Solve an Arena challenge → **+75 XP** + 30 gems\n• Unlock achievements → bonus XP + gems\n\nYou're currently **Level ${ctx.level}** with **${ctx.xp} XP**. Keep completing lessons to level up — each level needs more XP than the last!`,
  },
  {
    keywords: ['heart', 'hearts', 'energy', 'how does energy work', 'out of energy', 'no energy'],
    response: (ctx) => `**Hearts / Energy** ⚡\n\nYou have **${ctx.energy}/${ctx.maxEnergy}** energy right now.\n\n• Each lesson costs **1 energy**\n• Using a hint in Arena costs **1 energy**\n• Running/submitting code costs **1 energy**\n• Energy **auto-refills** when you run out — so you're never fully blocked!\n\nThink of it as a gentle pacing system, not a hard wall.`,
  },
  {
    keywords: ['gem', 'gems', 'coin', 'coins', 'currency'],
    response: (ctx) => `**Gems/Coins** 💎\n\nYou have **${ctx.coins} gems**! Earn them by:\n• Completing lessons (+10)\n• Passing quizzes (+15)\n• Solving challenges (+30)\n• Unlocking achievements (bonus rewards)\n\nGems are your in-app currency — a sign of how much you've learned!`,
  },
  {
    keywords: ['streak', 'streaks', 'daily streak', 'login streak'],
    response: (ctx) => `**Streaks** 🔥\n\nYour current streak: **${ctx.streak} day${ctx.streak === 1 ? '' : 's'}**\n\nHow it works:\n• Open the app and stay active each day → streak **+1**\n• Miss a day → streak resets to 1\n• 3-day streak → unlocks "On Fire" badge\n• 7-day streak → unlocks "Unstoppable" badge\n\nConsistency beats intensity — even 10 minutes a day keeps your streak alive!`,
  },
  {
    keywords: ['badge', 'badges', 'achievement', 'achievements', 'unlock badge', 'how to get badges'],
    response: (ctx) => `**Badges & Achievements** 🏆\n\nYou've completed **${ctx.lessonsCompleted} lessons** and **${ctx.challengesSolved} challenges**.\n\nBadges unlock automatically when you:\n• Complete 1, 5, or 10 lessons\n• Solve 1 or 5 Arena challenges\n• Hit a 3-day or 7-day streak\n• Reach Level 5 or Level 10\n• Find secret badges (hidden — try coding at night 🌙 or typing fast ⚡!)\n\nCheck the **Achievements** page to see your progress on each one!`,
  },
  {
    keywords: ['course', 'courses', 'which course', 'start with', 'best course', 'beginner course', 'recommend course'],
    response: (ctx) => `**Bitzy Courses** 📚\n\nAvailable courses, roughly easiest → hardest:\n1. **HTML Fundamentals** — start here if you're brand new!\n2. **CSS Fundamentals** — style your pages\n3. **JavaScript Basics** — make pages interactive\n4. **Python Fundamentals** — great for beginners too\n5. **Git & GitHub** — version control essentials\n6. **TypeScript Essentials**\n7. **React Fundamentals**\n8. **Node.js & Backend**\n9. **SQL & Databases**\n10. **Data Structures** — for interview prep\n\nYou're Level ${ctx.level} — ${ctx.level <= 2 ? "I'd suggest starting with **HTML Fundamentals** if you haven't already!" : "you're ready to mix in JavaScript or Python if you haven't started those!"}`,
  },
  {
    keywords: ['game', 'games', 'speed typing', 'bug hunt', 'memory match', 'code battle', 'code quiz', 'fill in the blank'],
    response: () => `**Bitzy Games** 🎮\n\n• **Code Quiz** — multiple choice questions on programming concepts\n• **Speed Typing** — type code snippets fast & accurately (click/press a key to start!)\n• **Bug Hunt** — find and fix bugs in broken code\n• **Memory Match** — match coding term pairs\n• **Code Battle** — head-to-head coding challenges\n• **Code Prediction** — guess the output of code\n• **Fill in the Blank** — complete missing code\n\nAll games give XP and gems on completion. Great way to practice between lessons!`,
  },
  {
    keywords: ['arena', 'challenge', 'challenges', 'hint', 'hints'],
    response: () => `**Arena Challenges** ⚔️\n\n• Solve real coding problems for **+75 XP** and **+30 gems**\n• Each **hint** you reveal costs **1 energy**\n• Running or submitting code also costs **1 energy** (auto-refills)\n• Once solved, the challenge is marked **accepted** permanently\n\nTip: Try solving without hints first for the biggest learning boost — but don't be afraid to use them if stuck!`,
  },
  {
    keywords: ['leaderboard', 'league', 'rank', 'ranking', 'diamond league', 'top players'],
    response: (ctx) => `**Diamond League / Leaderboard** 🏆\n\nThe leaderboard shows **every registered user**, ranked by:\n1. Total **XP** (highest first)\n2. **Streak** (tiebreaker)\n\nYour profile picture (if you set one) and display name appear there. You're currently Level ${ctx.level} with ${ctx.xp} XP — keep learning to climb the ranks!`,
  },
  {
    keywords: ['profile', 'avatar', 'change name', 'display name', 'settings', 'edit profile'],
    response: () => `**Profile & Settings** ⚙️\n\nGo to the **Profile** page to:\n• Change your display name & bio\n• Upload a profile picture (shows on the Leaderboard too!)\n• View your stats: level, XP, streak, badges\n\nGo to **Settings** for theme (dark/light) and account options.`,
  },
  {
    keywords: ['sub ai', 'who are you', 'what can you do', 'what is sub ai', 'help'],
    response: (ctx) => `**I'm Sub AI** 🤖 — Bitzy's built-in coding mentor!\n\nI can help with:\n• Explaining programming concepts (JS, Python, React, CSS, SQL, Git...)\n• Navigating Bitzy — XP, streaks, badges, games, leaderboard\n• Debugging tips and best practices\n\nJust ask me things like *"explain JS closures"* or *"how do I earn more gems"*. Hi ${ctx.name}, what do you want to explore? 🚀`,
  },

  // ===== PROGRAMMING CONCEPTS =====
  {
    keywords: ['closure', 'closures'],
    response: () => `**JavaScript Closures** 🔒\n\nA closure is a function that "remembers" variables from where it was created, even after that outer function has finished.\n\n${CODE.jsClosure}`,
  },
  {
    keywords: ['array method', 'map filter reduce', 'map()', 'filter()', 'reduce()', '.map', '.filter', '.reduce'],
    response: () => `**Array Methods: map, filter, reduce** 📊\n\n${CODE.jsArrayMethods}`,
  },
  {
    keywords: ['react hook', 'hooks', 'usestate', 'use state'],
    response: () => `**React Hooks: useState** ⚛️\n\nHooks let you use state and other React features in function components.\n\n${CODE.reactState}`,
  },
  {
    keywords: ['useeffect', 'use effect', 'side effect', 'lifecycle'],
    response: () => `**React Hooks: useEffect** ⚛️\n\n\`useEffect\` runs code after render — great for timers, API calls, subscriptions.\n\n${CODE.reactEffect}`,
  },
  {
    keywords: ['python basic', 'python', 'learn python'],
    response: () => `**Python Basics** 🐍\n\n${CODE.pythonBasics}\n\nCheck out the **Python Fundamentals** course for a full guided path!`,
  },
  {
    keywords: ['flexbox', 'flex', 'css layout', 'center a div'],
    response: () => `**CSS Flexbox** 🎨\n\n${CODE.cssFlexbox}`,
  },
  {
    keywords: ['html structure', 'html basics', 'what is html', 'html document'],
    response: () => `**HTML Document Structure** 🌐\n\n${CODE.htmlStructure}`,
  },
  {
    keywords: ['sql join', 'join', 'sql', 'database query', 'select statement'],
    response: () => `**SQL JOIN** 🗄️\n\n${CODE.sqlJoin}\n\nCheck the **SQL & Databases** course for SELECT, GROUP BY, and more!`,
  },
  {
    keywords: ['git', 'github', 'version control', 'commit', 'branch'],
    response: () => `**Git Basics** 🌿\n\n${CODE.gitBasics}\n\nThe **Git & GitHub** course covers branching, merging, and collaboration in depth!`,
  },
  {
    keywords: ['typescript', 'interface', 'type safety', 'ts'],
    response: () => `**TypeScript Interfaces** 📘\n\n${CODE.tsInterface}\n\nTypeScript catches type errors before you even run your code!`,
  },
  {
    keywords: ['data structure', 'linked list', 'array vs linked list', 'algorithm'],
    response: () => `**Data Structures** 🌲\n\n${CODE.dataStructureArray}\n\nCheck the **Data Structures** course for trees, graphs, stacks, queues and more!`,
  },
  {
    keywords: ['variable', 'var let const', 'declare variable'],
    response: () => `**Variables in JavaScript** 📦\n\n\`\`\`javascript
let count = 10;     // can be reassigned
const name = "Bitzy"; // cannot be reassigned
var old = "legacy";   // avoid — function-scoped, old style
\`\`\`\nUse \`const\` by default, \`let\` when you need to reassign.`,
  },
  {
    keywords: ['function', 'arrow function', 'how to write a function'],
    response: () => `**Functions in JavaScript** ⚙️\n\n\`\`\`javascript
// Regular function
function add(a, b) {
  return a + b;
}

// Arrow function
const add2 = (a, b) => a + b;
\`\`\`\nArrow functions are shorter and don't have their own \`this\`.`,
  },
  {
    keywords: ['loop', 'for loop', 'while loop', 'iterate'],
    response: () => `**Loops** 🔁\n\n\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log(i);
}

let n = 0;
while (n < 3) {
  console.log(n);
  n++;
}
\`\`\``,
  },
];

// Fuzzy match: find best matching KB entry, or return fallback
export function getSubAIResponse(userMessage: string, ctx: SubAIContext): string {
  const msg = userMessage.toLowerCase();

  let bestMatch: KBEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (msg.includes(kw.toLowerCase())) {
        score += kw.split(' ').length; // longer matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response(ctx);
  }

  // Fallback — guide the user toward what Sub AI can help with
  return `I'm not totally sure about that one yet! 🤔 I can help with:\n\n• **Bitzy features**: XP, hearts, gems, streaks, badges, leaderboard, games, Arena\n• **Coding concepts**: JS closures, arrays, React hooks, Python basics, CSS flexbox, SQL joins, Git, TypeScript, data structures\n\nTry asking something like *"explain react hooks"* or *"how do streaks work"*. Or tap one of the quick questions below! 👇`;
}
