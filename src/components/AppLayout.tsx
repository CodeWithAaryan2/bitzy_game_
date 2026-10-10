import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Trophy, Sparkles, Swords, Gamepad2,
  Sun, Moon, User, LogOut, Shield, Heart, Star,
  FolderKanban, Flame,
  Mic, Users, ChevronRight, X, Grid3X3, Award, Bug, Network, BrainCircuit
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame, MAX_ENERGY } from '@/context/GameContext';
import { useTheme } from '@/context/ThemeContext';
import { useAppBackButton } from '@/hooks/useAppBackButton';
import ChatWidget from './ChatWidget';
import XPPopupOverlay from './XPPopupOverlay';
import XPBar from './XPBar';
import AppTour, { TOUR_KEY } from './AppTour';
import WatchAdButton from './WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

const sidebarNav = [
  { path: '/app/dashboard', label: 'Learn', icon: Home },
  { path: '/app/courses', label: 'Courses', icon: BookOpen },
  // { path: '/app/bug-detective', label: 'Bug Detective', icon: Bug },
  // { path: '/app/skill-tree', label: 'Skill Tree', icon: Network },
  { path: '/app/games', label: 'Play', icon: Gamepad2 },
  { path: '/app/challenges', label: 'Arena', icon: Swords },
  { path: '/app/leaderboard', label: 'League', icon: Trophy },
  { path: '/app/achievements', label: 'Badges', icon: Star },
  { path: '/app/mentor', label: 'AI Mentor', icon: Sparkles },
];

const sidebarNavExtra = [
  // { path: '/app/boss-battle', label: 'Boss Battle', icon: Swords },
  // { path: '/app/developer-dna', label: 'Developer DNA', icon: BrainCircuit },
  // { path: '/app/playground', label: 'Playground', icon: Code2 },
  { path: '/app/projects', label: 'Projects', icon: FolderKanban },
  // { path: '/app/paths', label: 'Paths', icon: Route },
  { path: '/app/streak', label: 'Streak', icon: Flame },
  // { path: '/app/pet', label: 'My Pet', icon: PawPrint },
  { path: '/app/interview', label: 'Interview', icon: Mic },
  { path: '/app/community', label: 'Community', icon: Users },
  { path: '/app/certificates', label: 'Certificates', icon: Award },
];

const mobileNav = [
  { path: '/app/dashboard', label: 'Learn', icon: Home },
  { path: '/app/courses', label: 'Courses', icon: BookOpen },
  { path: '/app/games', label: 'Play', icon: Gamepad2 },
  { path: '/app/challenges', label: 'Arena', icon: Swords },
  { path: '/app/leaderboard', label: 'League', icon: Trophy },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { xpPopups, dismissPopup, refillEnergy } = useGame();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  useAppBackButton();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const [tourVisible, setTourVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setTourVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const xp = profile?.xp ?? 0;
  const displayName = profile?.display_name ?? 'Learner';
  const avatar = profile?.avatar;
  const streak = profile?.current_streak ?? 0;

  return (
    <div className="d-main min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <XPPopupOverlay popups={xpPopups} onDismiss={dismissPopup} />

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="d-sidebar overflow-y-auto">
        <div className="p-5 flex items-center gap-3">
          <div
            data-tour="logo" className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#071A3D] to-[#0052CC] cursor-pointer active:scale-95 transition-transform"
            onClick={() => setTourVisible(true)}
            title="App Tour"
          >
            <img src="/mascot.png" alt="Bitzy" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[#2B7FFF]">Bitzy</h1>
            <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Learn to Code</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="mx-4 mb-3 p-3 rounded-3xl border-2" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-[#2B7FFF]" style={{ backgroundColor: 'rgba(43,127,255,0.12)' }}>
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-[#2B7FFF]">{displayName[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <XPBar xp={xp} variant="compact" className="mt-0.5" />
              {streak > 0 && (
                <div className="text-[10px] font-bold mt-0.5" style={{ color: '#FF4B4B' }}>
                  🔥 {streak} day streak
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-2">
          {/* Primary nav */}
          {sidebarNav.map((item) => (
            <div key={item.path} data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => navigate(item.path)} className={`d-nav-item ${isActive(item.path) ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isActive(item.path) && <div className="ml-auto w-2 h-2 rounded-full bg-[#58CC02]" />}
            </div>
          ))}

          {/* Divider */}
          <div className="my-2 mx-2 border-t" style={{ borderColor: 'var(--border)' }} />
          <p className="text-[10px] font-bold px-3 mb-1" style={{ color: 'var(--text-muted)' }}>EXPLORE</p>

          {/* Extra nav */}
          {sidebarNavExtra.map((item) => (
            <div key={item.path} data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => navigate(item.path)} className={`d-nav-item ${isActive(item.path) ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isActive(item.path) && <div className="ml-auto w-2 h-2 rounded-full bg-[#58CC02]" />}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t-2" style={{ borderColor: 'var(--border)' }}>
          <div onClick={() => navigate('/app/profile')} className="d-nav-item">
            <User className="w-5 h-5" />
            Profile
          </div>
          <div onClick={() => navigate('/app/settings')} className="d-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Settings
          </div>
          {isAdmin && (
            <div onClick={() => navigate('/app/admin')} className="d-nav-item" style={{ color: '#FF9600' }}>
              <Shield className="w-5 h-5" /> Admin Panel
            </div>
          )}
          <div data-tour="theme-toggle" onClick={toggleTheme} className="d-nav-item">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </div>
          <div onClick={logout} className="d-nav-item" style={{ color: '#FF4B4B' }}>
            <LogOut className="w-5 h-5" /> Sign Out
          </div>
        </div>
      </aside>

      {/* ===== MOBILE HEADER ===== */}
      <header
        className="lg:hidden sticky top-0 z-30 border-b-2" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div data-tour="logo" className="flex items-center gap-2.5" onClick={() => setTourVisible(true)} style={{ cursor: 'pointer' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2B7FFF' }}>
              <img src="/mascot.png" alt="" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-display text-lg font-bold text-[#2B7FFF]">Bitzy</span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl" style={{ backgroundColor: 'rgba(255,75,75,0.10)' }}
                onClick={() => navigate('/app/streak')}>
                <span className="text-xs font-bold" style={{ color: '#FF4B4B' }}>🔥{streak}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl" style={{ backgroundColor: 'rgba(255,200,0,0.12)' }}>
              <Heart className="w-3.5 h-3.5 text-[#FF4B4B]" />
              <span className="text-xs font-bold text-[#FF4B4B]">{profile?.energy ?? 0}</span>
              {(profile?.energy ?? 0) < MAX_ENERGY && (
                <WatchAdButton
                  adUnitId={AD_UNITS.heartRefill}
                  label=""
                  onReward={refillEnergy}
                  className="w-4 h-4 rounded-full"
                  style={{ color: '#FF4B4B', padding: 0, gap: 0 }}
                />
              )}
            </div>
            <button data-tour="theme-toggle" onClick={toggleTheme} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
              {theme === 'light' ? <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Sun className="w-4 h-4 text-[#FFC800]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-5 pb-28 lg:pb-6">
          <Outlet />
        </div>
      </main>

      {/* ===== CHAT WIDGET ===== */}
      {!location.pathname.startsWith('/app/mentor') && !location.pathname.startsWith('/app/games') && <ChatWidget />}

      {/* ===== APP TOUR ===== */}
      <AppTour visible={tourVisible} onClose={() => setTourVisible(false)} />

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t-2" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around py-1 max-w-lg mx-auto px-1">
          {mobileNav.map((item) => {
            const active = isActive(item.path);
            return (
              <motion.button key={item.path} data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`} whileTap={{ scale: 0.85 }} onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-1.5 sm:px-3 py-1.5 rounded-2xl relative flex-1">
                {active && <motion.div layoutId="mobTab" className="absolute inset-0 rounded-2xl" style={{ backgroundColor: 'rgba(88,204,2,0.1)' }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <item.icon className="w-[18px] h-[18px] sm:w-5 sm:h-5 relative z-10" style={{ color: active ? '#58CC02' : 'var(--text-muted)' }} />
                <span className="text-[9px] sm:text-[10px] font-bold relative z-10 font-display" style={{ color: active ? '#58CC02' : 'var(--text-muted)' }}>{item.label}</span>
              </motion.button>
            );
          })}
          {/* MORE button */}
          <motion.button
            data-tour="nav-more"
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowMoreDrawer(true)}
            className="flex flex-col items-center gap-0.5 px-1.5 sm:px-3 py-1.5 rounded-2xl relative flex-1"
          >
            <Grid3X3 className="w-[18px] h-[18px] sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
            <span className="text-[9px] sm:text-[10px] font-bold font-display" style={{ color: 'var(--text-muted)' }}>More</span>
          </motion.button>
        </div>
      </nav>

      {/* ===== MORE DRAWER (Mobile) ===== */}
      <AnimatePresence>
        {showMoreDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowMoreDrawer(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl border-t-2 p-5"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg">Explore Bitzy</h3>
                <button onClick={() => setShowMoreDrawer(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...sidebarNav.slice(mobileNav.length), ...sidebarNavExtra].map((item) => {
                  const active = isActive(item.path);
                  return (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { navigate(item.path); setShowMoreDrawer(false); }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
                      style={{
                        borderColor: active ? '#58CC02' : 'var(--border)',
                        backgroundColor: active ? 'rgba(88,204,2,0.12)' : 'var(--surface)',
                      }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: active ? '#58CC02' : 'var(--text-muted)' }} />
                      <span className="text-[10px] font-bold text-center leading-tight" style={{ color: active ? '#58CC02' : 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
                {/* Profile & Settings in drawer too */}
                {[
                  { path: '/app/profile', label: 'Profile', icon: User },
                  { path: '/app/settings', label: 'Settings', icon: ChevronRight },
                ].map(item => (
                  <motion.button
                    key={item.path}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { navigate(item.path); setShowMoreDrawer(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Sign out in drawer */}
              <button
                onClick={() => { logout(); setShowMoreDrawer(false); }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: 'rgba(255,75,75,0.12)', color: '#FF4B4B' }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
