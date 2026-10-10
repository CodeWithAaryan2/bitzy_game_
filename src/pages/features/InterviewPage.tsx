import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Star, ChevronRight, RotateCcw, Clock, ArrowLeft, Zap } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const INTERVIEW_TYPES = [
  {
    id: 'technical',
    title: 'Technical Interview',
    emoji: '💻',
    desc: 'JavaScript, algorithms, system design, CS concepts',
    color: '#1CB0F6',
    difficulty: 'Hard',
    duration: '30 min',
    xpPerQ: 60,
    questions: [
      { q: 'Explain the difference between var, let, and const in JavaScript.', category: 'JavaScript', hint: 'Think about scope (block vs function), hoisting behavior, and whether the binding can be reassigned.' },
      { q: 'What is a closure? Write a simple example and explain a real-world use case.', category: 'JavaScript', hint: 'A closure is when a function "remembers" its outer scope. Think: counter factory, data privacy.' },
      { q: 'What is the difference between == and === in JavaScript?', category: 'JavaScript', hint: '== does type coercion. === is strict (no coercion). Example: "1" == 1 is true, "1" === 1 is false.' },
      { q: 'Explain event bubbling and event capturing in the DOM.', category: 'DOM', hint: 'Bubbling: child → parent. Capturing: parent → child. stopPropagation() stops both.' },
      { q: 'What is the time complexity of binary search and how does it work?', category: 'Algorithms', hint: 'O(log n). Divide sorted array in half each step. Discard the half that cannot contain the target.' },
      { q: 'Explain the difference between null and undefined in JavaScript.', category: 'JavaScript', hint: 'undefined: variable declared but not assigned. null: intentional absence of value.' },
      { q: 'What is a Promise? How does async/await relate to Promises?', category: 'Async', hint: 'Promise: object representing future value. async/await is syntactic sugar over Promises.' },
      { q: 'Explain what "this" refers to in JavaScript and how arrow functions differ.', category: 'JavaScript', hint: 'this depends on call context. Arrow functions capture "this" from surrounding scope (lexical this).' },
    ],
  },
  {
    id: 'react',
    title: 'React Interview',
    emoji: '⚛️',
    desc: 'React, hooks, state, performance, patterns',
    color: '#61DAFB',
    difficulty: 'Hard',
    duration: '35 min',
    xpPerQ: 70,
    questions: [
      { q: 'What is the difference between state and props in React?', category: 'React Basics', hint: 'State: internal, mutable, owned by component. Props: external, read-only, passed from parent.' },
      { q: 'Explain the useEffect hook. When would you use it and what are common mistakes?', category: 'Hooks', hint: 'Runs after render. Common mistakes: missing deps array, infinite loops, forgetting cleanup.' },
      { q: 'What is the Virtual DOM and how does React use it?', category: 'Internals', hint: 'Virtual DOM is a lightweight JS representation. React diffs it with real DOM and applies minimal changes.' },
      { q: 'When should you use useMemo vs useCallback?', category: 'Performance', hint: 'useMemo: memoize computed values. useCallback: memoize function references to prevent re-renders.' },
      { q: 'What is prop drilling and how can you avoid it?', category: 'State Management', hint: 'Passing props through multiple levels. Solutions: Context API, state managers (Zustand, Redux), composition.' },
      { q: 'Explain the difference between controlled and uncontrolled components.', category: 'Forms', hint: 'Controlled: React state drives the input value. Uncontrolled: DOM manages the value via ref.' },
      { q: 'How does React handle keys in lists and why are they important?', category: 'Lists', hint: 'Keys help React identify changed/added/removed items. Using index as key can cause bugs with reordering.' },
      { q: 'What is the Context API and when would you use it over props?', category: 'Context', hint: 'Context provides global data (theme, auth, lang). Use when data is needed by many components at different nesting levels.' },
    ],
  },
  {
    id: 'behavioral',
    title: 'Behavioral Interview',
    emoji: '🤝',
    desc: 'Situational questions, soft skills, teamwork, culture fit',
    color: '#58CC02',
    difficulty: 'Medium',
    duration: '20 min',
    xpPerQ: 45,
    questions: [
      { q: 'Tell me about yourself and why you want to be a software developer.', category: 'Introduction', hint: 'Cover: background, what sparked your interest in coding, what you\'ve built, why this role excites you.' },
      { q: 'Describe a challenging project. What obstacles did you face and how did you overcome them?', category: 'Problem Solving', hint: 'Use STAR: Situation, Task, Action, Result. Be specific. Quantify your impact.' },
      { q: 'Tell me about a time you had to learn a new technology quickly. How did you approach it?', category: 'Learning', hint: 'Show systematic learning: docs → tutorials → build a project. Show you can self-teach.' },
      { q: 'How do you handle criticism of your code during a code review?', category: 'Teamwork', hint: 'Show growth mindset. Separate ego from code. Ask clarifying questions. Thank the reviewer.' },
      { q: 'Describe a time you disagreed with a technical decision. What did you do?', category: 'Communication', hint: 'Show respectful disagreement: raise concerns with data/reasoning, accept team decision, commit fully.' },
      { q: 'Where do you see yourself in 3 years as a developer?', category: 'Career', hint: 'Show ambition + realism. Mention technical depth or leadership. Align with the company\'s growth.' },
      { q: 'How do you manage your time when working on multiple tasks or projects?', category: 'Organization', hint: 'Mention prioritization (urgent vs important), tools (Notion, Jira), communication when blocked.' },
      { q: 'Tell me about a time you helped a teammate. What was the outcome?', category: 'Collaboration', hint: 'Show mentoring, pair programming, or sharing knowledge. Show you lift the team, not just yourself.' },
    ],
  },
  {
    id: 'system-design',
    title: 'System Design',
    emoji: '🏗️',
    desc: 'Architecture, scalability, databases, trade-offs',
    color: '#CE82FF',
    difficulty: 'Expert',
    duration: '45 min',
    xpPerQ: 90,
    questions: [
      { q: 'How would you design a URL shortener like bit.ly? Walk me through the key components.', category: 'Design', hint: 'Cover: hash function (base62), DB (key-value), redirect flow, analytics, rate limiting, CDN.' },
      { q: 'What is the difference between SQL and NoSQL databases? When would you choose each?', category: 'Databases', hint: 'SQL: structured, ACID, relations. NoSQL: flexible schema, horizontal scale. NoSQL for high write throughput or unstructured data.' },
      { q: 'Explain REST vs GraphQL. What are the trade-offs?', category: 'APIs', hint: 'REST: multiple endpoints, simple, cacheable. GraphQL: single endpoint, flexible queries, no over/under-fetching.' },
      { q: 'How would you design a real-time chat application? What technologies would you use?', category: 'Real-time', hint: 'Cover: WebSockets, message queue (Redis), DB for history, presence system, read receipts, scale with pub/sub.' },
      { q: 'What is horizontal vs vertical scaling? When would you use each?', category: 'Scalability', hint: 'Vertical: bigger machine (limit exists). Horizontal: more machines (need stateless design, load balancer).' },
      { q: 'What is caching? Where would you use it in a web application?', category: 'Performance', hint: 'Cover: client cache, CDN, Redis/Memcached. Cache DB queries, session data, computed results. TTL, cache invalidation.' },
    ],
  },
  {
    id: 'coding',
    title: 'Live Coding Challenge',
    emoji: '⚡',
    desc: 'Write real code and explain your thought process',
    color: '#FF9600',
    difficulty: 'Hard',
    duration: '45 min',
    xpPerQ: 80,
    questions: [
      { q: 'Write a function that reverses a string without using the built-in .reverse() method. Explain your time and space complexity.', category: 'Strings', hint: 'Two-pointer approach: swap characters from both ends. O(n) time, O(n) space if creating new string.' },
      { q: 'Implement a function to check if a string is a palindrome (ignoring spaces and case).', category: 'Strings', hint: 'Normalize first (toLowerCase, remove spaces), then two-pointer or reverse and compare.' },
      { q: 'Write a function to find all duplicates in an array. Optimize for O(n) time.', category: 'Arrays', hint: 'Use a Set or Map to track seen elements. First seen: add to map. Second seen: add to duplicates.' },
      { q: 'Implement a debounce function from scratch.', category: 'Functions', hint: 'Store a timer. Each call: clearTimeout old timer, set new setTimeout. Fire fn only after delay ms of silence.' },
      { q: 'Write a function that deep clones a JavaScript object (handle nested objects and arrays).', category: 'Objects', hint: 'Recursive approach: check type (array/object/primitive), create copy, recurse for each key/index.' },
      { q: 'Implement a simple LRU cache with get() and put() methods.', category: 'Data Structures', hint: 'Use Map (maintains insertion order) + size limit. On get: delete + re-insert to move to end. On put overflow: delete first entry.' },
    ],
  },
];

type Phase = 'lobby' | 'intro' | 'question' | 'feedback' | 'results';
interface Message { role: 'interviewer' | 'user'; text: string; timestamp: Date; }
const SCORE_LABELS = ['Needs Work', 'Developing', 'Satisfactory', 'Good', 'Excellent'];
const SCORE_COLORS = ['#FF4B4B', '#FF9600', '#FFC800', '#58CC02', '#2B7FFF'];

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }}>
          <Star className="w-5 h-5" fill={i <= score ? '#FFC800' : 'none'} style={{ color: i <= score ? '#FFC800' : 'var(--border)' }} />
        </motion.div>
      ))}
    </div>
  );
}

export default function InterviewPage() {
  const { showXPPopup, addXP } = useGame();
  const { profile } = useAuth();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [selectedType, setSelectedType] = useState<typeof INTERVIEW_TYPES[0] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [feedbacks, setFeedbacks] = useState<Array<{ strengths: string; improvements: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [historyOpen, setHistoryOpen] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom AI-generated interview (role/JD tailored)
  const [customRole, setCustomRole] = useState('');
  const [customJD, setCustomJD] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [customError, setCustomError] = useState('');

  // AI holistic final report
  const [finalSummary, setFinalSummary] = useState<{ verdict: string; topStrength: string; focusArea: string; readiness: string } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const currentQ = selectedType?.questions[qIndex];
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const addMsg = (role: Message['role'], text: string) =>
    setMessages(m => [...m, { role, text, timestamp: new Date() }]);

  const startInterview = (type: typeof INTERVIEW_TYPES[0]) => {
    setSelectedType(type);
    setQIndex(0);
    setScores([]);
    setFeedbacks([]);
    setMessages([]);
    setAnswer('');
    setTotalXPEarned(0);
    setFinalSummary(null);
    setPhase('intro');
    setTimeout(() => {
      setPhase('question');
      setTimerActive(true);
      addMsg('interviewer',
        `Hello${profile?.display_name ? `, ${profile.display_name}` : ''}! 👋 I'm your AI interviewer today.\n\nThis is a ${type.title}. I'll ask you ${type.questions.length} questions and give you detailed feedback after each one.\n\nLet's start!\n\n**Q1:** ${type.questions[0].q}`
      );
      setTimeLeft(120);
    }, 1800);
  };

  const generateCustomInterview = async () => {
    if (!customRole.trim() || generatingCustom) return;
    setGeneratingCustom(true);
    setCustomError('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1800,
          system: `You are a senior technical recruiter. Generate a realistic interview for the target role. Mix technical, practical, and role-specific questions calibrated to the role/JD. Respond ONLY with JSON, no markdown/backticks, in this exact shape:
{"title":"short interview name","emoji":"one relevant emoji","difficulty":"Easy|Medium|Hard|Expert","questions":[{"q":"question text","category":"short category","hint":"a short 1-sentence hint pointing toward a strong answer"}]}
Generate exactly 6 questions, ordered from warm-up to most challenging.`,
          messages: [{
            role: 'user',
            content: `Target role: ${customRole.trim()}\n${customJD.trim() ? `Job description / focus areas:\n${customJD.trim().slice(0, 2000)}` : 'No job description provided — use standard expectations for this role.'}`
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text ?? '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) throw new Error('bad response');
      const customType: typeof INTERVIEW_TYPES[0] = {
        id: 'custom',
        title: parsed.title || `${customRole.trim()} Interview`,
        emoji: parsed.emoji || '🎯',
        desc: `Tailored to: ${customRole.trim()}`,
        color: '#FF4B4B',
        difficulty: parsed.difficulty || 'Hard',
        duration: `${parsed.questions.length * 5} min`,
        xpPerQ: 75,
        questions: parsed.questions,
      };
      setCustomOpen(false);
      startInterview(customType);
    } catch {
      setCustomError('Could not generate the interview right now. Please try again.');
    }
    setGeneratingCustom(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQ || loading) return;
    const userAnswer = answer.trim();
    setAnswer('');
    setTimerActive(false);
    addMsg('user', userAnswer);
    setLoading(true);
    setPhase('feedback');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `You are a senior software engineer and expert interviewer conducting a ${selectedType?.title} for a developer role.
Evaluate the candidate's answer thoroughly. Be encouraging but honest.
Respond ONLY in this exact JSON (no markdown, no backticks):
{"score":1-5,"label":"one of: Needs Work|Developing|Satisfactory|Good|Excellent","feedback":"2-3 sentence overall evaluation","strengths":"specific things they did well (1-2 sentences)","improvements":"specific things to improve with how (1-2 sentences)","model_answer":"a concise model answer in 2-3 sentences","follow_up":"encouraging comment or micro-tip to apply immediately"}`,
          messages: [{
            role: 'user',
            content: `Interview type: ${selectedType?.title}
Question: ${currentQ.q}
Category: ${currentQ.category}
Candidate's Answer: ${userAnswer}`
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text ?? '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const score = Math.max(1, Math.min(5, parseInt(String(parsed.score)) || 3));
      setScores(s => [...s, score]);
      setFeedbacks(f => [...f, { strengths: parsed.strengths ?? '', improvements: parsed.improvements ?? '' }]);
      const xpEarned = score * (selectedType?.xpPerQ ?? 50);
      setTotalXPEarned(t => t + xpEarned);
      await addXP(xpEarned, 'interview');

      addMsg('interviewer',
        `**Score: ${score}/5 — ${SCORE_LABELS[score - 1]}** ✦ +${xpEarned} XP\n\n` +
        `${parsed.feedback}\n\n` +
        `💪 **Strength:** ${parsed.strengths}\n` +
        `🎯 **Improve:** ${parsed.improvements}\n\n` +
        `📚 **Model Answer:** ${parsed.model_answer}\n\n` +
        `💡 ${parsed.follow_up}`
      );
    } catch {
      const fallback = 3;
      setScores(s => [...s, fallback]);
      setFeedbacks(f => [...f, { strengths: 'You attempted the question', improvements: 'Add more specific examples and structure your answer' }]);
      addMsg('interviewer', 'Good attempt! Structure your answers with examples for higher scores. Keep practicing!');
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (!selectedType) return;
    const next = qIndex + 1;
    if (next >= selectedType.questions.length) {
      const finalAvg = [...scores].reduce((a, b) => a + b, 0) / scores.length;
      if (finalAvg >= 4) showXPPopup(200, 'xp', '🏆 Outstanding interview! +200 XP!');
      else if (finalAvg >= 3) showXPPopup(100, 'xp', '👍 Solid interview! +100 XP!');
      setPhase('results');
      generateFinalSummary();
    } else {
      setQIndex(next);
      setPhase('question');
      setTimerActive(true);
      setTimeLeft(120);
      addMsg('interviewer', `Great! Moving on to question ${next + 1}:\n\n**Q${next + 1}:** ${selectedType.questions[next].q}`);
    }
  };

  const generateFinalSummary = async () => {
    if (!selectedType) return;
    setSummaryLoading(true);
    setFinalSummary(null);
    try {
      const userAnswers = messages.filter(m => m.role === 'user').map(m => m.text);
      const transcript = selectedType.questions.map((q, i) => {
        return `Q${i + 1} (${q.category}): ${q.q}\nAnswer: ${userAnswers[i] ?? '(no answer captured)'}\nScore: ${scores[i] ?? '-'}/5`;
      }).join('\n\n');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: `You are a senior hiring manager giving a final honest debrief after a ${selectedType.title}. Respond ONLY with JSON, no markdown: {"verdict":"2-3 sentence honest overall verdict on this candidate's performance","topStrength":"the single strongest recurring theme, 1 sentence","focusArea":"the single most important thing to improve before a real interview, 1 sentence","readiness":"one of: Not ready|Needs practice|Almost there|Interview ready"}`,
          messages: [{ role: 'user', content: transcript }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text ?? '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setFinalSummary({
        verdict: parsed.verdict ?? '',
        topStrength: parsed.topStrength ?? '',
        focusArea: parsed.focusArea ?? '',
        readiness: parsed.readiness ?? '',
      });
    } catch {
      setFinalSummary(null);
    }
    setSummaryLoading(false);
  };

  const timerColor = timeLeft <= 20 ? '#FF4B4B' : timeLeft <= 60 ? '#FF9600' : '#58CC02';
  const timerPct = (timeLeft / 120) * 100;

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-5">
      <AnimatePresence mode="wait">

        {/* ─── LOBBY ─── */}
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <motion.div variants={I}>
              <h1 className="font-display text-2xl font-bold mb-1">🎙️ AI Interview Coach</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Practice with an AI interviewer • Get real feedback • Land the job
              </p>
            </motion.div>

            <motion.div   variants={I}
  className="d-card !p-4"
  style={{
    background: "var(--surface)",
    border: "1px solid var(--border)"
  }}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">🤖</div>
                <div>
                  <p className="font-bold text-sm">How it works</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Answer questions in writing → AI gives instant scoring, model answer, and specific tips. Each answer earns XP!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Custom AI-Tailored Interview */}
            <motion.div variants={I} className="d-card overflow-hidden" style={{ borderColor: '#FF4B4B40' }}>
              <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF4B4B,#FF9600)' }} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: '#FF4B4B20' }}>🎯</div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold">Custom AI Interview</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tell the AI your target role (and paste a job description) — it writes 6 tailored questions just for you.</p>
                  </div>
                </div>
                {!customOpen ? (
                  <button onClick={() => setCustomOpen(true)}
                    className="d-btn d-btn-md w-full text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#FF4B4B', boxShadow: '0 4px 0 #FF4B4B80' }}>
                    Build My Interview <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input value={customRole} onChange={e => setCustomRole(e.target.value)}
                      placeholder="Target role, e.g. Junior React Developer at a startup"
                      className="w-full text-sm p-3 rounded-2xl border-2 outline-none"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
                    <textarea value={customJD} onChange={e => setCustomJD(e.target.value)}
                      placeholder="Optional: paste the job description or key skills to focus on"
                      className="w-full text-sm p-3 rounded-2xl border-2 outline-none resize-none"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', minHeight: 70, color: 'var(--text)' }} />
                    {customError && <p className="text-[11px] font-bold" style={{ color: '#FF4B4B' }}>{customError}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => setCustomOpen(false)} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                      <button onClick={generateCustomInterview} disabled={!customRole.trim() || generatingCustom}
                        className="flex-1 d-btn d-btn-md text-white flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#FF4B4B', boxShadow: '0 4px 0 #FF4B4B80', opacity: !customRole.trim() ? 0.6 : 1 }}>
                        {generatingCustom ? 'Generating…' : 'Generate Interview'} <Zap className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {INTERVIEW_TYPES.map(type => (
              <motion.div key={type.id} variants={I} className="d-card overflow-hidden" style={{ borderColor: type.color + '40' }}>
                <div className="h-1.5" style={{ background: `linear-gradient(90deg,${type.color},${type.color}60)` }} />
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: type.color + '20' }}>{type.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold">{type.title}</h3>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{type.desc}</p>
                      <div className="flex items-center gap-2.5 text-[10px] flex-wrap">
                        <span className="font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: type.color + '18', color: type.color }}>
                          {type.difficulty}
                        </span>
                        <span className="flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-3 h-3" />{type.duration}
                        </span>
                        <span className="flex items-center gap-0.5 font-bold" style={{ color: '#FFC800' }}>
                          <Zap className="w-3 h-3" />up to {type.questions.length * type.xpPerQ * 5} XP
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{type.questions.length} questions</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => startInterview(type)}
                    className="d-btn d-btn-md w-full text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: type.color, boxShadow: `0 4px 0 ${type.color}80` }}>
                    Start Interview <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ─── INTRO ─── */}
        {phase === 'intro' && selectedType && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-4">
            <motion.div className="text-7xl" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              {selectedType.emoji}
            </motion.div>
            <h2 className="font-display text-2xl font-bold">Preparing Your Interview...</h2>
            <p style={{ color: 'var(--text-muted)' }}>AI interviewer is getting ready</p>
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedType.color }}
                  animate={{ scale: [1, 1.6, 1] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── QUESTION + CHAT ─── */}
        {(phase === 'question' || phase === 'feedback') && selectedType && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3" style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column' }}>

            {/* HUD */}
            <div className="d-card !p-3 flex items-center gap-3" style={{ borderColor: selectedType.color + '50' }}>
              <button onClick={() => setPhase('lobby')} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--surface)' }}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{selectedType.title}</p>
                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>Q{qIndex + 1}/{selectedType.questions.length}</span>
                  <span>·</span>
                  <span style={{ color: '#FFC800' }}>+{totalXPEarned} XP earned</span>
                </div>
              </div>
              {/* Timer */}
              {phase === 'question' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <svg width="36" height="36" viewBox="0 0 36 36" className="flex-shrink-0">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke={timerColor} strokeWidth="3"
                      strokeDasharray={`${timerPct} 100`} strokeDashoffset="25" strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }}
                      transform="rotate(-90 18 18)" />
                    <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="800" fill={timerColor}>{timeLeft}</text>
                  </svg>
                </div>
              )}
            </div>

            {/* Q progress pills */}
            <div className="flex gap-1.5 px-1">
              {selectedType.questions.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full"
                  style={{ backgroundColor: i < scores.length ? SCORE_COLORS[scores[i] - 1] : i === qIndex ? selectedType.color + '60' : 'var(--border)' }} />
              ))}
            </div>

            {/* Chat */}
            <div className="flex-1 space-y-3 overflow-y-auto min-h-0 pb-2">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {msg.role === 'interviewer' && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-1"
                      style={{ backgroundColor: selectedType.color + '20' }}>🤖</div>
                  )}
                  <div className="max-w-[88%] p-3.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: msg.role === 'user' ? selectedType.color : 'var(--surface)',
                      color: msg.role === 'user' ? 'white' : 'var(--text)',
                      borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 pl-10">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--text-muted)' }}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
                  ))}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Evaluating your answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {phase === 'question' && (
              <div className="d-card !p-3 space-y-2">
                {currentQ?.hint && (
                  <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    💡 Hint: {currentQ.hint}
                  </p>
                )}
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={selectedType.id === 'coding' ? '// Write your code here, then explain your approach... (Ctrl+Enter to submit)' : 'Type your answer... (Ctrl+Enter to submit)'}
                    spellCheck={selectedType.id !== 'coding'}
                    className="flex-1 resize-none outline-none text-sm p-3 rounded-2xl border-2 leading-relaxed"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: selectedType.id === 'coding' ? '#1E1E2E' : 'var(--surface)',
                      color: selectedType.id === 'coding' ? '#D4D4E8' : 'var(--text)',
                      fontFamily: selectedType.id === 'coding' ? 'ui-monospace, "SF Mono", Consolas, monospace' : undefined,
                      minHeight: selectedType.id === 'coding' ? 140 : 90,
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitAnswer(); }}
                  />
                  <button onClick={submitAnswer} disabled={!answer.trim() || loading}
                    className="w-12 rounded-2xl flex items-center justify-center text-white transition-opacity"
                    style={{ backgroundColor: selectedType.color, opacity: answer.trim() && !loading ? 1 : 0.4 }}>
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>Take your time • Quality speed</p>
              </div>
            )}

            {phase === 'feedback' && !loading && (
              <button onClick={nextQuestion}
                className="d-btn d-btn-md w-full text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: selectedType.color, boxShadow: `0 4px 0 ${selectedType.color}80` }}>
                {qIndex + 1 >= selectedType.questions.length ? '🏁 See Results' : `Next Question (${qIndex + 2}/${selectedType.questions.length})`}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* ─── RESULTS ─── */}
        {phase === 'results' && selectedType && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            {/* Hero */}
            <div className="text-center py-4">
              <motion.div className="text-6xl mb-3" animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1 }}>
                {avgScore >= 4 ? '🏆' : avgScore >= 3 ? '🎉' : '💪'}
              </motion.div>
              <h2 className="font-display text-2xl font-bold mb-1">Interview Complete!</h2>
              <p style={{ color: 'var(--text-muted)' }}>{selectedType.title}</p>
            </div>

            {/* Score card */}
            <div className="d-card !p-5 text-center">
              <div className="font-display text-5xl font-black mb-2"
                style={{ color: SCORE_COLORS[Math.round(avgScore) - 1] ?? '#58CC02' }}>{avgScore}/5</div>
              <div className="flex justify-center mb-2"><ScoreStars score={Math.round(avgScore)} /></div>
              <p className="font-bold text-sm">{SCORE_LABELS[Math.round(avgScore) - 1]}</p>
              <div className="mt-3 flex justify-center gap-4 text-sm">
                <span className="flex items-center gap-1 font-bold" style={{ color: '#FFC800' }}>
                  <Zap className="w-4 h-4" />+{totalXPEarned} XP
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{scores.length} questions</span>
              </div>
            </div>

            {/* Per-Q breakdown */}
            <div>
              <p className="font-bold text-sm mb-2 px-1">Question Breakdown</p>
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <button className="w-full d-card !p-3 text-left" onClick={() => setHistoryOpen(historyOpen === i ? null : i)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                          style={{ backgroundColor: SCORE_COLORS[s - 1] + '20', color: SCORE_COLORS[s - 1] }}>Q{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{selectedType.questions[i].q.slice(0, 55)}…</p>
                          <p className="text-[10px]" style={{ color: SCORE_COLORS[s - 1] }}>{SCORE_LABELS[s - 1]}</p>
                        </div>
                        <div className="font-display font-black" style={{ color: SCORE_COLORS[s - 1] }}>{s}/5</div>
                      </div>
                      <AnimatePresence>
                        {historyOpen === i && feedbacks[i] && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                              <p className="text-[10px]"><span className="font-bold" style={{ color: '#58CC02' }}>💪 Strong:</span> {feedbacks[i].strengths}</p>
                              <p className="text-[10px]"><span className="font-bold" style={{ color: '#FF9600' }}>🎯 Improve:</span> {feedbacks[i].improvements}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Holistic Debrief */}
            <div className="d-card !p-4" style={{ borderColor: '#FF4B4B40' }}>
              <p className="font-bold text-sm mb-2 flex items-center gap-1.5">🧠 AI Hiring Manager Debrief</p>
              {summaryLoading ? (
                <div className="flex items-center gap-2 py-2">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }}
                      animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
                  ))}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Reviewing your full interview...</span>
                </div>
              ) : finalSummary ? (
                <div className="space-y-2.5">
                  <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FF4B4B18', color: '#FF4B4B' }}>
                    {finalSummary.readiness}
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>{finalSummary.verdict}</p>
                  <p className="text-[11px]"><span className="font-bold" style={{ color: '#58CC02' }}>💪 Top strength:</span> {finalSummary.topStrength}</p>
                  <p className="text-[11px]"><span className="font-bold" style={{ color: '#FF9600' }}>🎯 Focus next:</span> {finalSummary.focusArea}</p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Couldn't generate a debrief right now — your per-question breakdown below still has full feedback.</p>
              )}
            </div>

            {/* What to do next */}
            <div className="d-card !p-4" style={{ background: 'linear-gradient(135deg,#F0FFE5,#E5F6FF)' }}>
              <p className="font-bold text-sm mb-2">📈 What to do next</p>
              <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {avgScore < 3 && <p>• Review the model answers above and practice each question again out loud</p>}
                {avgScore >= 3 && avgScore < 4 && <p>• Focus on adding specific examples (use STAR method for behavioral, code snippets for technical)</p>}
                {avgScore >= 4 && <p>• Excellent! Try a harder interview type or practice with a friend for real conditions</p>}
                <p>• Retry this interview type to improve your score and earn more XP</p>
                <p>• Complete courses to strengthen weak areas</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPhase('lobby')} className="flex-1 d-btn d-btn-ghost d-btn-md flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> All Interviews
              </button>
              <button onClick={() => startInterview(selectedType)} className="flex-1 d-btn d-btn-md text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: selectedType.color, boxShadow: `0 4px 0 ${selectedType.color}80` }}>
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}