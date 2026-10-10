import { 
  useState, 
  useRef, 
  useEffect 
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  Send,
  RotateCcw,
  Sparkles,
  BookOpen,
  Bug,
  Mic,
  Rocket,
  Copy,
  Check,
  Brain,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  getSmartResponse,
} from "@/lib/ai/aiRouter";

import {
  KB_SIZE,
} from "@/lib/ai/subAiBrain";

import type {
  AIMode,
} from "@/lib/ai/types";

// =====================================
// AI Modes
// =====================================

const MODES: {
  id: AIMode;
  name: string;
  icon: any;
  color: string;
}[] = [
  {
    id: "teacher",
    name: "Teacher",
    icon: BookOpen,
    color: "#58CC02",
  },
  {
    id: "debug",
    name: "Debug",
    icon: Bug,
    color: "#FF9600",
  },
  {
    id: "interview",
    name: "Interview",
    icon: Mic,
    color: "#FF4B4B",
  },
  {
    id: "project",
    name: "Project",
    icon: Rocket,
    color: "#1CB0F6",
  },
];

// =====================================
// Chat Message Interface
// =====================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  source?: "bitzy" | "claude" | "gemini";
  liked?: boolean | null;
}

// =====================================
// Time Helper
// =====================================

function getTime() {
  return new Date()
    .toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
}

// =====================================
// Copy Helper
// =====================================

async function copyCode(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } 
  catch (err) {
    console.error("Copy failed", err);
  }
}

// =====================================
// Markdown Renderer
// =====================================

function renderMessage(text: string) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  
  return blocks.map((block, index) => {
    // Code blocks
    if (block.startsWith("```")) {
      const match = block.match(/```(\w+)?\n?([\s\S]*?)```/);
      
      if (match) {
        const language = match[1];
        const code = match[2];
        
        return (
          <CodeBlock
            key={index}
            code={code}
            language={language}
          />
        );
      }
    }
    
    // Normal text
    const html = block.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    return (
      <div
        key={index}
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: html
        }}
      />
    );
  });
}

// =====================================
// Code Block Component
// =====================================

function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyCode(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div
      className="my-3 overflow-hidden rounded-2xl border"
      style={{
        borderColor: "rgba(255,255,255,.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: "#171717",
        }}
      >
        <span
          className="text-xs font-bold uppercase"
          style={{
            color: "#58CC02",
          }}
        >
          {language || "CODE"}
        </span>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs transition"
          style={{
            color: "#ffffff80",
          }}
        >
          {copied ? (
            <>
              <Check size={14}/>
              Copied
            </>
          ) : (
            <>
              <Copy size={14}/>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre
        className="overflow-x-auto p-4 text-sm"
        style={{
          background: "#0D1117",
          color: "#E6EDF3",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// =====================================
// AI Source Badge
// =====================================

function SourceBadge({
  source,
}: {
  source?: "bitzy" | "claude" | "gemini";
}) {
  if (!source) return null;

  const color = source === "bitzy" ? "#58CC02" : "#CE82FF";
  const label = "Bitzy Brain ⚡";

  return (
    <span
      className="text-[10px] px-2 py-1 rounded-full font-bold inline-flex items-center gap-1"
      style={{
        background: `${color}20`,
        color,
      }}
    >
      <Sparkles size={10} />
      {label}
    </span>
  );
}

// =====================================
// Feedback Buttons
// =====================================

function FeedbackButtons() {
  const [liked, setLiked] = useState<boolean | null>(null);

  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => setLiked(true)}
        className="p-2 rounded-xl transition"
        style={{
          background: liked === true ? "#58CC0220" : "var(--surface)",
          color: liked === true ? "#58CC02" : "var(--text-muted)",
        }}
      >
        <ThumbsUp size={14}/>
      </button>

      <button
        onClick={() => setLiked(false)}
        className="p-2 rounded-xl transition"
        style={{
          background: liked === false ? "#FF4B4B20" : "var(--surface)",
          color: liked === false ? "#FF4B4B" : "var(--text-muted)",
        }}
      >
        <ThumbsDown size={14}/>
      </button>
    </div>
  );
}

// =====================================
// MAIN AI MENTOR COMPONENT
// =====================================

export default function AIMentorPage() {
  const { profile } = useAuth();

  const firstName = profile?.display_name?.split(" ")[0] || "Coder";

  // AI Mode
  const [mode, setMode] = useState<AIMode>("teacher");

  // Messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey ${firstName}! 👋

Main hoon **Sub AI** 🤖

Main tumhara personal coding mentor hoon.

Mujhse puch sakte ho:

📚 Programming:
HTML, CSS, JavaScript, React, Python, SQL, Git, DSA

🐛 Debug:
Apna error bhejo aur main fix karunga.

🚀 Projects:
Startup ideas, architecture, tech stack.

🎤 Interview:
Mock interview practice.

Chalo coding shuru karte hain! 🔥`,
      time: getTime(),
      source: "bitzy",
    }
  ]);

  // Input
  const [input, setInput] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // Chat scroll
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Send Message
  async function handleSend(text?: string) {
    const message = (text || input).trim();

    if (!message || loading) return;

    // User message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      time: getTime(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // AI Request
      const response = await getSmartResponse({
        message,
        mode,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        user: {
          name: firstName,
          level: profile?.level ?? 1,
          xp: profile?.xp ?? 0,
          streak: profile?.current_streak ?? 0,
        },
      });

      // AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text,
        time: getTime(),
        source: response.source,
      };

      setMessages(prev => [...prev, aiMessage]);
    } 
    catch(error) {
      console.error("Sub AI Error:", error);
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `⚠️ Oops!

Sub AI ko thoda issue aa gaya.

Please dobara try karo 😅`,
          time: getTime(),
          source: "bitzy",
        }
      ]);
    } 
    finally {
      setLoading(false);
    }
  }

  // Clear Chat
  function clearChat() {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Fresh start 🚀

Batao ${firstName},
aaj kya seekhna hai?`,
        time: getTime(),
        source: "bitzy",
      }
    ]);
  }

  // UI RETURN
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* ================= Header ================= */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/mascot.png"
              alt="Sub AI"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className="font-bold text-lg"
                style={{ color: "var(--text)" }}
              >
                Sub AI
              </h1>

              <span
                className="px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
                style={{ background: "#CE82FF20", color: "#CE82FF" }}
              >
                <Brain size={10}/>
                AI
              </span>
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Trained on {KB_SIZE}+ topics — 100% Offline, No API ⚡
            </p>
          </div>
        </div>

        <button onClick={clearChat} className="p-2 rounded-xl">
          <RotateCcw size={18}/>
        </button>
      </div>

      {/* ================= Modes ================= */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {MODES.map(item => {
          const Icon = item.icon;
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap"
              style={{
                background: active ? item.color : "var(--surface)",
                color: active ? "white" : "var(--text)"
              }}
            >
              <Icon size={14}/>
              {item.name}
            </button>
          );
        })}
      </div>

      {/* ================= Messages ================= */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4"
      >
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <img
                  src="/mascot.png"
                  alt="Sub AI"
                  className="w-8 h-8 rounded-xl"
                />
              )}

              <div>
                <div
                  className="px-4 py-3 rounded-2xl max-w-[500px] text-sm"
                  style={{
                    background: msg.role === "user" ? "#1CB0F6" : "var(--surface)",
                    color: msg.role === "user" ? "white" : "var(--text)"
                  }}
                >
                  {renderMessage(msg.content)}
                </div>

                {msg.role === "assistant" && (
                  <>
                    <div className="mt-2">
                      <SourceBadge source={msg.source} />
                    </div>
                    <FeedbackButtons />
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-sm px-3"
          >
            🤖 Sub AI is thinking...
          </motion.div>
        )}
      </div>

      {/* ================= Input ================= */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Ask coding, debug, projects..."
          className="flex-1 px-4 py-3 rounded-2xl outline-none"
          style={{
            background: "var(--surface)",
            color: "var(--text)"
          }}
        />
        
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #CE82FF, #7C3AED)",
            color: "white"
          }}
        >
          <Send size={18}/>
        </button>
      </div>
    </div>
  );
}