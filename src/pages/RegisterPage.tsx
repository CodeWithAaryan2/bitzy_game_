import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LanguagePicker from '@/components/LanguagePicker';
import { applyTranslation } from '@/lib/googleTranslate';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, updateProfile, isLoggedIn } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'language'>('form');
  const [lang, setLang] = useState('en');

  if (isLoggedIn && step !== 'language') {
    navigate('/app/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    const { error: regError } = await register(username, email, password);
    setIsSubmitting(false);

    if (regError) {
      setError(regError);
      return;
    }

    // Account created — one more click to pick a learning language before
    // landing on the dashboard.
    setStep('language');
  };

  const confirmLanguage = async () => {
    await updateProfile({ preferred_language: lang });
    if (lang === 'en') {
      navigate('/app/dashboard', { replace: true });
    } else {
      // applyTranslation reloads the page to translate all DB-driven course
      // content too; the session is already persisted, so after reload the
      // logged-in redirect above sends the user straight to the dashboard.
      applyTranslation(lang);
    }
  };

  if (step === 'language') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-full max-w-sm">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mb-6">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(88,204,2,0.12)' }}>
              <Globe className="w-8 h-8" style={{ color: '#58CC02' }} />
            </div>
            <h1 className="font-display text-2xl font-black">Choose your language</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Learn coding in the language you're most comfortable with — you can change this anytime in Settings.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="d-card">
            <LanguagePicker selected={lang} onSelect={setLang} />
            <button onClick={confirmLanguage} className="d-btn d-btn-md d-btn-green w-full mt-4">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mb-8">
          <motion.img src="/mascot.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
          <h1 className="font-display text-2xl font-black">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Start your coding adventure!</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="d-card">
            {error && (
              <div className="p-3 rounded-2xl text-sm font-bold mb-4 text-center" style={{ backgroundColor: '#FFE8E8', color: '#FF4B4B' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="d-input pl-10 w-full" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="d-input pl-10 w-full" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="d-input pl-10 pr-10 w-full" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
              <button type="submit" disabled={isSubmitting} className="d-btn d-btn-md d-btn-green w-full disabled:opacity-50">
                {isSubmitting ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </motion.div>

        <p className="text-center text-xs mt-5 font-bold" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <button onClick={() => navigate('/login')} className="text-[#58CC02]">Sign In</button>
        </p>
      </div>
    </div>
  );
}