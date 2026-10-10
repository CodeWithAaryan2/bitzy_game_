import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSmartResponse } from '@/lib/ai/aiRouter';
import { useAuth } from '@/context/AuthContext';
import type { MemoryMessage } from '@/lib/ai/types';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm **Sub AI** — ask me anything about coding (JS, Python, React, CSS...) or how Bitzy works. I run 100% offline on your device!",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setThinking(true);

    const history: MemoryMessage[] = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await getSmartResponse({
        message: text,
        mode: 'teacher',
        history,
        user: {
          name: profile?.display_name ?? 'Learner',
          level: profile?.level ?? 1,
          xp: profile?.xp ?? 0,
          streak: profile?.current_streak ?? 0,
        },
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Something went wrong. Try asking again!" }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed z-50 flex items-center justify-center rounded-full shadow-lg"
            style={{
              bottom: 'calc(72px + env(safe-area-inset-bottom))',
              right: '16px',
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg,#CE82FF,#A855C7)',
              boxShadow: '0 4px 0 0 #8C3FD4',
            }}
            aria-label="Open Sub AI chat"
          >
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <img src="/mascot.png" alt="Sub AI" className="w-8 h-8 object-contain" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t-2 shadow-2xl"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              height: 'min(70vh, 560px)',
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg,#CE82FF,#A855C7)' }}>
                  <img src="/mascot.png" alt="Sub AI" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold" style={{ color: 'var(--text)' }}>Sub AI</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Offline coding mentor</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
                    style={{
                      backgroundColor: m.role === 'user' ? '#2B7FFF' : 'var(--surface)',
                      color: m.role === 'user' ? 'white' : 'var(--text)',
                      border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3.5 py-2.5 text-sm flex items-center gap-1" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }}>•</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>•</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>•</motion.span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
              {['Explain closures', 'How does XP work?', 'CSS flexbox', 'Open full chat'].map(q => (
                <button
                  key={q}
                  onClick={() => {
                    if (q === 'Open full chat') {
                      setOpen(false);
                      navigate('/app/mentor');
                      return;
                    }
                    setInput(q);
                  }}
                  className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t-2" style={{ borderColor: 'var(--border)', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Ask Sub AI anything..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || thinking}
                className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#CE82FF,#A855C7)' }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
