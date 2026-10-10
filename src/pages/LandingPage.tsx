import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Gamepad2, Swords, Star, Flame, Zap, CheckCircle2, Trophy, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const features = [
    { icon: BookOpen, text: '15+ coding courses' },
    { icon: Gamepad2, text: '7 game modes' },
    { icon: Swords, text: '50+ challenges' },
    { icon: Trophy, text: 'Diamond League' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2B7FFF' }}>
            <img src="/mascot.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-display text-2xl font-black" style={{ color: '#2B7FFF' }}>Bitzy</span>
        </div>
        {isLoggedIn ? (
          <button onClick={() => navigate('/app/dashboard')} className="d-btn d-btn-sm d-btn-green">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="d-btn d-btn-sm d-btn-ghost">Sign In</button>
            <button onClick={() => navigate('/register')} className="d-btn d-btn-sm d-btn-green">Get Started</button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="mb-6">
          <motion.img src="/mascot.png" alt="Bitzy" className="w-28 h-28 mx-auto object-contain mb-4" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
          <h1 className="font-display text-4xl sm:text-5xl font-black mb-3" style={{ color: 'var(--text)' }}>Learn to Code</h1>
          <h2 className="font-display text-2xl sm:text-3xl font-black mb-4" style={{ color: '#58CC02' }}>Like Playing a Game!</h2>
          <p className="text-base max-w-md mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>Master HTML, CSS, JavaScript, React, Python, and more with interactive lessons, coding games, and challenges.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 mb-10">
          {isLoggedIn ? (
            <button onClick={() => navigate('/app/dashboard')} className="d-btn d-btn-lg d-btn-green text-lg">
              <LayoutDashboard className="w-5 h-5" /> Go to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/register')} className="d-btn d-btn-lg d-btn-green text-lg">
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/login')} className="d-btn d-btn-lg d-btn-white text-lg">
                I Already Have an Account
              </button>
            </>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
              <f.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#58CC02' }} />
              <span className="text-xs font-bold">{f.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-10 flex items-center gap-6">
          {[
            { icon: Zap, label: 'Earn XP', color: '#FFC800' },
            { icon: Flame, label: 'Build Streaks', color: '#FF9600' },
            { icon: Star, label: 'Win Badges', color: '#CE82FF' },
            { icon: CheckCircle2, label: 'Track Progress', color: '#58CC02' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: item.color + '15' }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="text-center py-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-2">
          <Link to="/privacy" className="text-xs font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
            Privacy Policy
          </Link>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
          <Link to="/privacy" className="text-xs font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>
            Contact Support
          </Link>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bitzy - Gamified Coding Platform © 2026</p>
      </footer>
    </div>
  );
}
