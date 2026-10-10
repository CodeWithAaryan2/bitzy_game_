import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoggedIn) {
    navigate('/app/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError);
      setIsSubmitting(false);
      return;
    }

    navigate('/app/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mb-8">
          <motion.img src="/mascot.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
          <h1 className="font-display text-2xl font-black">Welcome Back!</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to continue learning</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="d-card">
            {error && (
              <div className="p-3 rounded-2xl text-sm font-bold mb-4 text-center" style={{ backgroundColor: 'rgba(255,75,75,0.12)', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="d-input pl-10 w-full"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="d-input pl-10 pr-10 w-full"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
              <button type="submit" disabled={isSubmitting} className="d-btn d-btn-md d-btn-green w-full disabled:opacity-50">
                {isSubmitting ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="block w-full text-center text-sm font-bold mt-3"
              style={{ color: 'var(--blue)' }}
            >
              Forgot password?
            </button>

            <button
              onClick={() => navigate('/register')}
              className="d-btn d-btn-md d-btn-blue w-full"
            >
              <Sparkles className="w-4 h-4" /> Create New Account
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}