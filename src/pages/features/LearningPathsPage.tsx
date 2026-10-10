/**
 * src/pages/features/LearningPathsPage.tsx
 *
 * Learning Paths — DB-connected.
 * Path structure (metadata, steps) lives here.
 * Each step references a courseSlug — resolved against published courses from DB.
 * Steps whose course is not published are hidden.
 * Progress pulled from real gameState.courseProgress.
 * Zero hardcoded course IDs — all lookups by slug.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Lock, ChevronRight, Clock, Zap, ArrowLeft,
  Trophy, Play, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

// ── Path + step definitions — display metadata only ───────────────────────
// courseSlug must match courses.slug in DB. If not published → step hidden.
const PATHS = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    emoji: '🖥️',
    desc: 'Build beautiful, responsive UIs for the web',
    color: '#E34C26',
    bgGradient: 'linear-gradient(135deg,#E34C26 0%,#264DE4 100%)',
    duration: '3–6 months',
    difficulty: 'Beginner friendly',
    jobTitles: ['Frontend Developer', 'UI Developer', 'Web Developer'],
    avgSalary: '₹6–15 LPA',
    outcomes: ['Build any website from scratch', 'Create React applications', 'Master CSS animations', 'Responsive mobile-first design'],
    steps: [
      { id: 's1', title: 'HTML Basics',       emoji: '📄', courseSlug: 'html-basics',       xp: 600,  weeks: 1, desc: 'Structure of the web — tags, elements, semantic HTML' },
      { id: 's2', title: 'CSS Fundamentals',  emoji: '🎨', courseSlug: 'css-fundamentals',   xp: 800,  weeks: 2, desc: 'Styles, layouts, flexbox, grid, animations' },
      { id: 's3', title: 'JavaScript',        emoji: '⚡', courseSlug: 'javascript-basics',  xp: 1000, weeks: 3, desc: 'DOM manipulation, events, async/await, APIs' },
      { id: 's4', title: 'React',             emoji: '⚛️', courseSlug: 'react-basics',       xp: 1200, weeks: 4, desc: 'Components, hooks, state management, routing' },
      { id: 's5', title: 'TypeScript',        emoji: '📘', courseSlug: 'typescript-basics',  xp: 1000, weeks: 2, desc: 'Type safety, interfaces, generics for robust code' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    emoji: '⚙️',
    desc: 'Build powerful APIs and server-side systems',
    color: '#68A063',
    bgGradient: 'linear-gradient(135deg,#68A063 0%,#336791 100%)',
    duration: '4–8 months',
    difficulty: 'Intermediate',
    jobTitles: ['Backend Developer', 'API Engineer', 'Server-side Dev'],
    avgSalary: '₹7–18 LPA',
    outcomes: ['Build REST & GraphQL APIs', 'Design databases', 'Authentication & security', 'Deploy to production'],
    steps: [
      { id: 's1', title: 'Python Basics',     emoji: '🐍', courseSlug: 'python-basics',    xp: 600,  weeks: 2, desc: 'Syntax, OOP, libraries, scripting' },
      { id: 's2', title: 'Data Structures',   emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 2, desc: 'Arrays, trees, graphs, sorting algorithms' },
      { id: 's3', title: 'SQL & Databases',   emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'Queries, joins, indexes, transactions' },
      { id: 's4', title: 'Node.js & Backend', emoji: '🟢', courseSlug: 'nodejs-backend',   xp: 1200, weeks: 3, desc: 'Express, REST APIs, middleware, auth' },
      { id: 's5', title: 'Git & GitHub',      emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Version control, branches, PRs, CI/CD' },
      { id: 's6', title: 'TypeScript',        emoji: '📘', courseSlug: 'typescript-basics', xp: 900, weeks: 2, desc: 'Strong typing for scalable backends' },
    ],
  },
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    emoji: '🚀',
    desc: 'Master both frontend and backend — build anything',
    color: '#CE82FF',
    bgGradient: 'linear-gradient(135deg,#CE82FF 0%,#1CB0F6 100%)',
    duration: '8–14 months',
    difficulty: 'Advanced',
    jobTitles: ['Full Stack Dev', 'Software Engineer', 'Product Engineer'],
    avgSalary: '₹10–25 LPA',
    outcomes: ['Complete web applications', 'Frontend + Backend', 'Freelance ready', 'Startup / product ready'],
    steps: [
      { id: 's1', title: 'HTML Basics',    emoji: '📄', courseSlug: 'html-basics',       xp: 600,  weeks: 1, desc: 'Web structure foundation' },
      { id: 's2', title: 'CSS',            emoji: '🎨', courseSlug: 'css-fundamentals',  xp: 800,  weeks: 2, desc: 'Styling and layouts' },
      { id: 's3', title: 'JavaScript',     emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Core programming language of the web' },
      { id: 's4', title: 'React',          emoji: '⚛️', courseSlug: 'react-basics',      xp: 1200, weeks: 4, desc: 'Modern UI framework' },
      { id: 's5', title: 'Node.js',        emoji: '🟢', courseSlug: 'nodejs-backend',   xp: 1200, weeks: 3, desc: 'Backend APIs' },
      { id: 's6', title: 'SQL',            emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'Data storage and queries' },
      { id: 's7', title: 'TypeScript',     emoji: '📘', courseSlug: 'typescript-basics', xp: 1000, weeks: 2, desc: 'Type-safe full stack code' },
      { id: 's8', title: 'Git & GitHub',   emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Version control mastery' },
    ],
  },
  {
    id: 'data',
    title: 'Data Engineer',
    emoji: '📊',
    desc: 'Analyse, visualise, and build data pipelines',
    color: '#FFC800',
    bgGradient: 'linear-gradient(135deg,#FFC800 0%,#FF9600 100%)',
    duration: '5–9 months',
    difficulty: 'Intermediate',
    jobTitles: ['Data Analyst', 'Data Engineer', 'BI Developer'],
    avgSalary: '₹7–20 LPA',
    outcomes: ['Data analysis', 'SQL mastery', 'Python data tools', 'Dashboard building'],
    steps: [
      { id: 's1', title: 'Python Basics',   emoji: '🐍', courseSlug: 'python-basics',    xp: 600, weeks: 2, desc: 'Programming for data tasks' },
      { id: 's2', title: 'SQL & Databases', emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900, weeks: 2, desc: 'Queries, aggregations, joins' },
      { id: 's3', title: 'Data Structures', emoji: '📊', courseSlug: 'data-structures',  xp: 900, weeks: 3, desc: 'Efficient data algorithms' },
      { id: 's4', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500, weeks: 1, desc: 'Version control for data projects' },
      { id: 's5', title: 'TypeScript',      emoji: '📘', courseSlug: 'typescript-basics', xp: 900, weeks: 2, desc: 'Type-safe data processing' },
    ],
  },
  {
    id: 'gamedev',
    title: 'Game Developer',
    emoji: '🎮',
    desc: 'Build browser games — canvas, physics, game loops',
    color: '#FF9600',
    bgGradient: 'linear-gradient(135deg,#FF9600 0%,#FF4B4B 100%)',
    duration: '5–8 months',
    difficulty: 'Intermediate',
    jobTitles: ['Game Dev', 'Unity Dev', 'Interactive Dev'],
    avgSalary: '₹6–16 LPA',
    outcomes: ['Browser games', 'Canvas & WebGL', 'Game physics', 'Publish your game'],
    steps: [
      { id: 's1', title: 'HTML Basics',     emoji: '📄', courseSlug: 'html-basics',       xp: 600,  weeks: 1, desc: 'Canvas element foundation' },
      { id: 's2', title: 'JavaScript',      emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Game loops, collision detection' },
      { id: 's3', title: 'React',           emoji: '⚛️', courseSlug: 'react-basics',      xp: 1200, weeks: 3, desc: 'UI for game menus and HUDs' },
      { id: 's4', title: 'TypeScript',      emoji: '📘', courseSlug: 'typescript-basics', xp: 1000, weeks: 2, desc: 'Typed game engine code' },
      { id: 's5', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 2, desc: 'Spatial data, pathfinding, queues' },
      { id: 's6', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Publish and share your game' },
    ],
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    emoji: '🐳',
    desc: 'Automate, deploy, and scale software reliably',
    color: '#326CE5',
    bgGradient: 'linear-gradient(135deg,#326CE5 0%,#1A1A2E 100%)',
    duration: '5–9 months',
    difficulty: 'Intermediate',
    jobTitles: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer'],
    avgSalary: '₹8–20 LPA',
    outcomes: ['CI/CD pipelines', 'Server & backend automation', 'Database ops at scale', 'Version-controlled infrastructure'],
    steps: [
      { id: 's1', title: 'Git & GitHub',      emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Branching, PRs, CI/CD triggers' },
      { id: 's2', title: 'Python Basics',     emoji: '🐍', courseSlug: 'python-basics',    xp: 600,  weeks: 2, desc: 'Scripting for automation' },
      { id: 's3', title: 'Node.js & Backend', emoji: '🟢', courseSlug: 'nodejs-backend',   xp: 1200, weeks: 3, desc: 'Services you will deploy & monitor' },
      { id: 's4', title: 'SQL & Databases',   emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'Managing data layers in production' },
      { id: 's5', title: 'Data Structures',   emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 2, desc: 'Efficient systems-level thinking' },
      { id: 's6', title: 'TypeScript',        emoji: '📘', courseSlug: 'typescript-basics', xp: 900,  weeks: 2, desc: 'Type-safe tooling & scripts' },
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile App Developer',
    emoji: '📱',
    desc: 'Build cross-platform apps for iOS & Android',
    color: '#00D4A0',
    bgGradient: 'linear-gradient(135deg,#00D4A0 0%,#2B7FFF 100%)',
    duration: '4–8 months',
    difficulty: 'Intermediate',
    jobTitles: ['Mobile Developer', 'React Native Dev', 'App Engineer'],
    avgSalary: '₹6–17 LPA',
    outcomes: ['Cross-platform apps', 'Native-feel UI', 'App store deployment', 'Offline-first data sync'],
    steps: [
      { id: 's1', title: 'JavaScript',   emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Core language for React Native' },
      { id: 's2', title: 'React',        emoji: '⚛️', courseSlug: 'react-basics',      xp: 1200, weeks: 4, desc: 'Component model shared with React Native' },
      { id: 's3', title: 'TypeScript',   emoji: '📘', courseSlug: 'typescript-basics', xp: 1000, weeks: 2, desc: 'Type-safe mobile codebases' },
      { id: 's4', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures', xp: 900, weeks: 2, desc: 'Efficient app-side logic' },
      { id: 's5', title: 'Git & GitHub', emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Ship updates through CI/CD' },
    ],
  },
  {
    id: 'aiml',
    title: 'AI / ML Engineer',
    emoji: '🤖',
    desc: 'Build models and intelligent, data-driven systems',
    color: '#9146FF',
    bgGradient: 'linear-gradient(135deg,#9146FF 0%,#FF4B4B 100%)',
    duration: '7–12 months',
    difficulty: 'Advanced',
    jobTitles: ['ML Engineer', 'AI Engineer', 'Applied Scientist'],
    avgSalary: '₹9–24 LPA',
    outcomes: ['Python for ML', 'Data pipelines', 'Model reasoning & structures', 'Production-ready AI features'],
    steps: [
      { id: 's1', title: 'Python Basics',   emoji: '🐍', courseSlug: 'python-basics',    xp: 600,  weeks: 2, desc: 'The language of ML tooling' },
      { id: 's2', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 3, desc: 'Algorithms behind every model' },
      { id: 's3', title: 'SQL & Databases', emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'Feeding and querying training data' },
      { id: 's4', title: 'TypeScript',      emoji: '📘', courseSlug: 'typescript-basics', xp: 900, weeks: 2, desc: 'Typed APIs around your models' },
      { id: 's5', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Versioning experiments & code' },
    ],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Specialist',
    emoji: '🛡️',
    desc: 'Defend systems, find vulnerabilities, secure code',
    color: '#FF4B4B',
    bgGradient: 'linear-gradient(135deg,#1A1A2E 0%,#FF4B4B 100%)',
    duration: '6–10 months',
    difficulty: 'Advanced',
    jobTitles: ['Security Analyst', 'Penetration Tester', 'App Security Engineer'],
    avgSalary: '₹8–22 LPA',
    outcomes: ['Secure coding practices', 'Vulnerability analysis', 'Network & DB security', 'Threat-aware system design'],
    steps: [
      { id: 's1', title: 'Python Basics',   emoji: '🐍', courseSlug: 'python-basics',    xp: 600,  weeks: 2, desc: 'Scripting for security tools' },
      { id: 's2', title: 'JavaScript',      emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Understand web attack surfaces' },
      { id: 's3', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 2, desc: 'Algorithmic thinking for exploits & defenses' },
      { id: 's4', title: 'SQL & Databases', emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'SQL injection & database hardening' },
      { id: 's5', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Secure version control practices' },
    ],
  },
  {
    id: 'uiux',
    title: 'UI/UX Designer',
    emoji: '🎨',
    desc: 'Design and build interfaces people love to use',
    color: '#FF61C0',
    bgGradient: 'linear-gradient(135deg,#FF61C0 0%,#8A4FFF 100%)',
    duration: '3–6 months',
    difficulty: 'Beginner friendly',
    jobTitles: ['UI Designer', 'UX Engineer', 'Product Designer'],
    avgSalary: '₹5–14 LPA',
    outcomes: ['Design systems', 'Pixel-perfect layouts', 'Interactive prototypes', 'Accessible, responsive UI'],
    steps: [
      { id: 's1', title: 'HTML Basics',      emoji: '📄', courseSlug: 'html-basics',       xp: 600,  weeks: 1, desc: 'Semantic structure behind every design' },
      { id: 's2', title: 'CSS Fundamentals', emoji: '🎨', courseSlug: 'css-fundamentals',  xp: 800,  weeks: 2, desc: 'Layout, spacing, color, motion, animation' },
      { id: 's3', title: 'JavaScript',       emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Bring interactive prototypes to life' },
      { id: 's4', title: 'React',            emoji: '⚛️', courseSlug: 'react-basics',      xp: 1200, weeks: 4, desc: 'Turn designs into real, reusable components' },
      { id: 's5', title: 'Git & GitHub',     emoji: '🔀', courseSlug: 'git-github',        xp: 500,  weeks: 1, desc: 'Hand off design-to-dev the right way' },
    ],
  },
  {
    id: 'qa',
    title: 'QA Automation Engineer',
    emoji: '🧪',
    desc: 'Catch bugs before users do — build test automation',
    color: '#00B894',
    bgGradient: 'linear-gradient(135deg,#00B894 0%,#0984E3 100%)',
    duration: '4–7 months',
    difficulty: 'Intermediate',
    jobTitles: ['QA Engineer', 'SDET', 'Automation Tester'],
    avgSalary: '₹6–15 LPA',
    outcomes: ['Automated test suites', 'API & UI testing', 'CI/CD test pipelines', 'Bug-hunting mindset'],
    steps: [
      { id: 's1', title: 'JavaScript',      emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Language behind most test frameworks' },
      { id: 's2', title: 'TypeScript',      emoji: '📘', courseSlug: 'typescript-basics', xp: 900,  weeks: 2, desc: 'Type-safe, maintainable test code' },
      { id: 's3', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 2, desc: 'Think in edge cases and test coverage' },
      { id: 's4', title: 'SQL & Databases', emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'Validate data, not just UI' },
      { id: 's5', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Run tests automatically on every PR' },
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud Engineer',
    emoji: '☁️',
    desc: 'Design, deploy, and manage apps in the cloud',
    color: '#FF9900',
    bgGradient: 'linear-gradient(135deg,#FF9900 0%,#232F3E 100%)',
    duration: '6–10 months',
    difficulty: 'Intermediate',
    jobTitles: ['Cloud Engineer', 'Platform Engineer', 'Infrastructure Engineer'],
    avgSalary: '₹8–21 LPA',
    outcomes: ['Cloud-ready backends', 'Scalable databases', 'Automated deployments', 'Cost-aware architecture'],
    steps: [
      { id: 's1', title: 'Python Basics',     emoji: '🐍', courseSlug: 'python-basics',    xp: 600,  weeks: 2, desc: 'Infra automation & scripting' },
      { id: 's2', title: 'Node.js & Backend', emoji: '🟢', courseSlug: 'nodejs-backend',   xp: 1200, weeks: 3, desc: 'Services built to run in the cloud' },
      { id: 's3', title: 'SQL & Databases',   emoji: '🗄️', courseSlug: 'sql-basics',       xp: 900,  weeks: 2, desc: 'Managed database design' },
      { id: 's4', title: 'TypeScript',        emoji: '📘', courseSlug: 'typescript-basics', xp: 900, weeks: 2, desc: 'Typed cloud functions & APIs' },
      { id: 's5', title: 'Git & GitHub',      emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'GitOps-style deploy workflows' },
    ],
  },
  {
    id: 'blockchain',
    title: 'Blockchain Developer',
    emoji: '⛓️',
    desc: 'Build decentralized apps and smart contracts',
    color: '#627EEA',
    bgGradient: 'linear-gradient(135deg,#627EEA 0%,#1A1A2E 100%)',
    duration: '6–11 months',
    difficulty: 'Advanced',
    jobTitles: ['Blockchain Developer', 'Smart Contract Engineer', 'Web3 Developer'],
    avgSalary: '₹9–25 LPA',
    outcomes: ['dApp fundamentals', 'Wallet & transaction flows', 'Secure contract logic', 'Decentralized data thinking'],
    steps: [
      { id: 's1', title: 'JavaScript',      emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 3, desc: 'Core language of most Web3 tooling' },
      { id: 's2', title: 'TypeScript',      emoji: '📘', courseSlug: 'typescript-basics', xp: 900,  weeks: 2, desc: 'Type safety for contract-facing code' },
      { id: 's3', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 3, desc: 'Merkle trees, hashing, linked structures' },
      { id: 's4', title: 'Node.js & Backend', emoji: '🟢', courseSlug: 'nodejs-backend', xp: 1200, weeks: 3, desc: 'Backend services around your dApp' },
      { id: 's5', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Auditable, versioned contract history' },
    ],
  },
  {
    id: 'competitive',
    title: 'Competitive Programmer',
    emoji: '🧩',
    desc: 'Master DSA for top tech interviews and contests',
    color: '#F39C12',
    bgGradient: 'linear-gradient(135deg,#F39C12 0%,#D35400 100%)',
    duration: '4–8 months',
    difficulty: 'Advanced',
    jobTitles: ['SDE at product companies', 'Contest Programmer', 'Algorithm Engineer'],
    avgSalary: '₹10–28 LPA',
    outcomes: ['Strong DSA fundamentals', 'Interview-ready problem solving', 'Time/space complexity intuition', 'Contest-speed coding'],
    steps: [
      { id: 's1', title: 'Python Basics',   emoji: '🐍', courseSlug: 'python-basics',    xp: 600,  weeks: 2, desc: 'Fast, readable language for practice' },
      { id: 's2', title: 'Data Structures', emoji: '🗂️', courseSlug: 'data-structures',  xp: 900,  weeks: 4, desc: 'Arrays, trees, graphs, DP, sorting' },
      { id: 's3', title: 'JavaScript',      emoji: '⚡', courseSlug: 'javascript-basics', xp: 1000, weeks: 2, desc: 'Second language for varied practice' },
      { id: 's4', title: 'TypeScript',      emoji: '📘', courseSlug: 'typescript-basics', xp: 900,  weeks: 1, desc: 'Bonus: typed problem-solving practice' },
      { id: 's5', title: 'Git & GitHub',    emoji: '🔀', courseSlug: 'git-github',       xp: 500,  weeks: 1, desc: 'Track your solved-problems portfolio' },
    ],
  },
];

type PathDef = typeof PATHS[0];

// ── Path Card ─────────────────────────────────────────────────────────────────
function PathCard({
  path, visibleSteps, progressBySlug, totalXP, onSelect,
}: {
  path: PathDef;
  visibleSteps: PathDef['steps'];
  progressBySlug: Record<string, number>;
  totalXP: number;
  onSelect: () => void;
}) {
  const doneCnt = visibleSteps.filter((s) => (progressBySlug[s.courseSlug] ?? 0) >= 80).length;
  const pct = visibleSteps.length ? Math.round((doneCnt / visibleSteps.length) * 100) : 0;
  const enrolled = visibleSteps.filter((s) => (progressBySlug[s.courseSlug] ?? 0) > 0).length;

  if (visibleSteps.length === 0) return null;  // all courses unpublished → hide path

  return (
    <motion.div
      variants={I}
      whileHover={{ y: -3, boxShadow: `0 12px 40px ${path.color}25` }}
      className="d-card overflow-hidden cursor-pointer transition-shadow"
      onClick={onSelect}
      style={{ borderColor: path.color + '40' }}
    >
      <div className="h-1.5" style={{ background: path.bgGradient }} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-4xl flex-shrink-0">{path.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display font-bold">{path.title}</h3>
              {pct === 100 && <Trophy className="w-4 h-4" style={{ color: '#FFC800' }} />}
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{path.desc}</p>
            <div className="flex items-center gap-2.5 text-[10px] flex-wrap">
              <span className="font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: path.color + '18', color: path.color }}>
                {path.difficulty}
              </span>
              <span className="flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3" />{path.duration}
              </span>
              <span className="flex items-center gap-0.5 font-bold" style={{ color: '#FFC800' }}>
                <Zap className="w-3 h-3" />{totalXP.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        {/* Job titles */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {path.jobTitles.map((j) => (
            <span key={j} className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
              style={{ borderColor: path.color + '40', color: path.color }}>
              💼 {j}
            </span>
          ))}
        </div>

        {/* Progress */}
        {enrolled > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span style={{ color: 'var(--text-muted)' }}>{doneCnt}/{visibleSteps.length} courses done</span>
              <span style={{ color: path.color }}>{pct}%</span>
            </div>
            <div className="d-progress h-2 rounded-full overflow-hidden">
              <motion.div className="d-progress-fill"
                style={{ backgroundColor: path.color, width: `${pct}%` }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        )}

        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: path.color, boxShadow: `0 3px 0 ${path.color}80` }}
        >
          {pct === 100 ? '🏆 Completed!' : enrolled > 0 ? '▶ Continue Path' : '🚀 Start Path'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Path Detail ───────────────────────────────────────────────────────────────
function PathDetail({
  path, visibleSteps, progressBySlug, courseBySlug, totalXP, onBack,
}: {
  path: PathDef;
  visibleSteps: PathDef['steps'];
  progressBySlug: Record<string, number>;
  courseBySlug: Record<string, any>;
  totalXP: number;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const stepsWithProgress = visibleSteps.map((s) => ({
    ...s,
    progress: progressBySlug[s.courseSlug] ?? 0,
    done: (progressBySlug[s.courseSlug] ?? 0) >= 80,
    course: courseBySlug[s.courseSlug],
  }));
  const doneCnt = stepsWithProgress.filter((s) => s.done).length;
  const pct = stepsWithProgress.length ? Math.round((doneCnt / stepsWithProgress.length) * 100) : 0;
  const nextStep = stepsWithProgress.find((s) => !s.done);

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      className="space-y-4">

      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--surface)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="font-display font-bold text-lg">{path.emoji} {path.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{path.duration} · {path.avgSalary}</p>
        </div>
      </div>

      {/* Banner */}
      <div className="rounded-3xl overflow-hidden">
        <div className="h-20 relative flex items-center px-5" style={{ background: path.bgGradient }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <div className="text-white font-display font-black text-2xl">{pct}%</div>
            <div className="text-white/80 text-xs">Complete</div>
          </div>
          <div className="relative ml-auto text-right">
            <div className="text-white font-bold text-lg">{doneCnt}/{stepsWithProgress.length}</div>
            <div className="text-white/80 text-xs">Courses done</div>
          </div>
        </div>
        <div className="d-progress h-2" style={{ borderRadius: 0 }}>
          <div className="d-progress-fill" style={{ width: `${pct}%`, backgroundColor: path.color }} />
        </div>
      </div>

      {/* Outcomes */}
      <div className="d-card !p-4">
        <p className="font-bold text-sm mb-2">🎯 What you'll be able to do</p>
        <div className="grid grid-cols-2 gap-2">
          {path.outcomes.map((o) => (
            <div key={o} className="flex items-start gap-2 text-xs p-2 rounded-xl"
              style={{ backgroundColor: 'var(--surface)' }}>
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: path.color }} />
              <span>{o}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next up CTA */}
      {nextStep && (
        <button onClick={() => navigate(`/app/courses/${nextStep.courseSlug}`)}
          className="w-full d-card !p-4 flex items-center gap-3 text-left"
          style={{ borderColor: path.color, backgroundColor: path.color + '08' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: path.color + '20' }}>
            {nextStep.emoji}
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold" style={{ color: path.color }}>▶ NEXT UP</div>
            <div className="font-bold text-sm">{nextStep.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{nextStep.desc}</div>
          </div>
          <Play className="w-5 h-5 flex-shrink-0" style={{ color: path.color }} />
        </button>
      )}

      {/* Steps — from DB courses */}
      <div className="space-y-2">
        <p className="font-display font-bold text-sm px-1">Course Roadmap</p>
        {stepsWithProgress.map((step, i) => {
          const prevDone = i === 0 || stepsWithProgress[i - 1].done;
          // Courses are never locked — anyone can jump straight into any
          // course in any path, in any order. `prevDone` is only used below
          // to decide which step gets the "← Do this" recommendation badge.
          const locked = false;
          const current = !step.done && prevDone;
          const dbCourse = step.course;
          return (
            <motion.div key={step.id} className="relative">
              {i < stepsWithProgress.length - 1 && (
                <div className="absolute left-5 top-full w-0.5 h-2 z-0"
                  style={{ backgroundColor: step.done ? path.color : 'var(--border)' }} />
              )}
              <button
                onClick={() => !locked && navigate(`/app/courses/${step.courseSlug}`)}
                disabled={locked}
                className="w-full d-card !p-3 flex items-center gap-3 text-left transition-all"
                style={{
                  borderColor: step.done ? path.color : current ? path.color + '60' : 'var(--border)',
                  opacity: locked ? 0.5 : 1,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: dbCourse?.color
                      ? dbCourse.color + '20'
                      : step.done ? path.color + '20' : 'var(--surface)',
                  }}>
                  {step.done
                    ? <CheckCircle2 className="w-5 h-5" style={{ color: path.color }} />
                    : locked
                      ? <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      : <span className="text-lg">{step.emoji}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {dbCourse?.title ?? step.title}
                    </span>
                    {current && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: path.color + '20', color: path.color }}>
                        ← Do this
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {dbCourse?.description ?? step.desc}
                  </p>
                  {step.progress > 0 && !step.done && (
                    <div className="mt-1 d-progress h-1 rounded-full overflow-hidden">
                      <div className="d-progress-fill h-full"
                        style={{ width: `${step.progress}%`, backgroundColor: dbCourse?.color ?? path.color }} />
                    </div>
                  )}
                  {dbCourse && (
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {dbCourse.total_lessons} lessons · {dbCourse.difficulty}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-bold" style={{ color: '#FFC800' }}>+{step.xp}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>XP</div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Job roles */}
      <div className="d-card !p-4">
        <p className="font-bold text-sm mb-2">💼 Career Outcomes</p>
        <div className="space-y-2">
          {path.jobTitles.map((j) => (
            <div key={j} className="flex items-center justify-between text-sm p-2.5 rounded-2xl"
              style={{ backgroundColor: 'var(--surface)' }}>
              <span className="font-bold">💼 {j}</span>
              <span className="text-xs font-bold" style={{ color: '#58CC02' }}>{path.avgSalary}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total XP */}
      <div className="d-card !p-4 text-center"
        style={{ background: `linear-gradient(135deg,${path.color}15,${path.color}05)` }}>
        <div className="font-display font-black text-3xl" style={{ color: path.color }}>
          {totalXP.toLocaleString()} XP
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Total on completion</div>
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>⏱️ Estimated {path.duration}</div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LearningPathsPage() {
  const { profile } = useAuth();
  const { gameState } = useGame();
  const { data: dbCourses, loading } = useCourses();

  const [selectedPath, setSelectedPath] = useState<PathDef | null>(null);
  const [filter, setFilter] = useState('All');

  const xp = profile?.xp ?? 0;
  const cp = gameState.courseProgress;

  // Build slug→course and slug→progress maps from DB.
  // Matching is resilient: try an exact slug match first, then fall back to
  // a fuzzy keyword match against the course title — so a path still shows
  // even if the admin published a course under a slightly different slug
  // (e.g. "javascript-fundamentals" instead of "javascript-basics").
  const KEYWORD_FALLBACK: Record<string, string[]> = {
    'html-basics': ['html'],
    'css-fundamentals': ['css'],
    'javascript-basics': ['javascript', 'js'],
    'react-basics': ['react'],
    'typescript-basics': ['typescript', 'ts'],
    'python-basics': ['python'],
    'data-structures': ['data structure', 'dsa'],
    'sql-basics': ['sql', 'database'],
    'nodejs-backend': ['node', 'express', 'backend'],
    'git-github': ['git', 'github', 'version control'],
  };

  const normalize = (s: string) => (s ?? '').toLowerCase().trim();

  const findCourseForSlug = (courseSlug: string) => {
    const exact = (dbCourses ?? []).find((c: any) => c.slug === courseSlug);
    if (exact) return exact;
    const keywords = KEYWORD_FALLBACK[courseSlug] ?? [courseSlug.split('-')[0]];
    return (dbCourses ?? []).find((c: any) => {
      const title = normalize(c.title);
      return keywords.some((k) => title.includes(k));
    });
  };

  // Every distinct courseSlug referenced anywhere across all paths
  const allStepSlugs = Array.from(new Set(PATHS.flatMap((p) => p.steps.map((s) => s.courseSlug))));

  const courseBySlug: Record<string, any> = {};
  const progressBySlug: Record<string, number> = {};
  allStepSlugs.forEach((slug) => {
    const course = findCourseForSlug(slug);
    if (course) {
      courseBySlug[slug] = course;
      const prog = cp.find((p: any) => String(p.course_id) === String(course.id));
      progressBySlug[slug] = prog?.overall_progress ?? 0;
    }
  });

  // Always show every step of every path — this is a roadmap, not a gated course list.
  // If a matching published course exists in the DB we still show real progress on
  // that step; if not, the step just shows as an upcoming roadmap item (0% progress).
  const getVisibleSteps = (path: PathDef) => path.steps;

  const getTotalXP = (_path: PathDef, visibleSteps: PathDef['steps']) =>
    visibleSteps.reduce((acc, s) => acc + s.xp, 0);

  const filters = ['All', 'Beginner friendly', 'Intermediate', 'Advanced'];
  const filteredPaths = PATHS.filter((p) => filter === 'All' || p.difficulty === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {selectedPath ? (
        <PathDetail
          key="detail"
          path={selectedPath}
          visibleSteps={getVisibleSteps(selectedPath)}
          progressBySlug={progressBySlug}
          courseBySlug={courseBySlug}
          totalXP={getTotalXP(selectedPath, getVisibleSteps(selectedPath))}
          onBack={() => setSelectedPath(null)}
        />
      ) : (
        <motion.div key="list" variants={W} initial="hidden" animate="show" className="space-y-5">

          <motion.div variants={I}>
            <h1 className="font-display text-2xl font-bold mb-1">🛣️ Learning Paths</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Choose your career goal and follow the map to get there
            </p>
          </motion.div>

          {/* User stats */}
          <motion.div variants={I} className="d-card !p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Your Progress</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {cp.filter((c: any) => c.overall_progress > 0).length} courses started ·{' '}
                  {cp.filter((c: any) => c.overall_progress >= 100).length} completed
                </p>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-xl" style={{ color: '#FFC800' }}>
                  {xp.toLocaleString()}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total XP</div>
              </div>
            </div>
          </motion.div>

          {/* Filter pills */}
          <motion.div variants={I} className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-shrink-0 px-3 py-1.5 rounded-2xl border-2 text-xs font-bold transition-all"
                style={{
                  borderColor: filter === f ? '#2B7FFF' : 'var(--border)',
                  backgroundColor: filter === f ? '#EBF2FF' : 'var(--white)',
                  color: filter === f ? '#2B7FFF' : 'var(--text-muted)',
                }}>
                {f}
              </button>
            ))}
          </motion.div>

          {filteredPaths.length === 0 && (
            <div className="text-center py-8">
              <p className="font-bold" style={{ color: 'var(--text-muted)' }}>
                No paths available for this filter yet.
              </p>
            </div>
          )}

          {filteredPaths.map((path) => {
            const visibleSteps = getVisibleSteps(path);
            return (
              <PathCard
                key={path.id}
                path={path}
                visibleSteps={visibleSteps}
                progressBySlug={progressBySlug}
                totalXP={getTotalXP(path, visibleSteps)}
                onSelect={() => setSelectedPath(path)}
              />
            );
          })}

          <motion.div variants={I} className="d-card d-card-blue !p-4 text-center">
            <p className="font-bold text-sm mb-1">💡 Pro tip</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Courses you complete in any path count across ALL paths. Start one course, progress multiple paths!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}