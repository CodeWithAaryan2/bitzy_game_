import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const PASSWORD_RULES: { test: (pw: string) => boolean; label: string }[] = [
  { test: (pw) => pw.length >= 8, label: 'At least 8 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'One number' },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  // The recovery link redirects here with a token Supabase exchanges for a
  // session automatically (detectSessionInUrl: true in lib/supabase.ts).
  // Until that session lands, this page has nothing valid to act on.
  const [sessionReady, setSessionReady] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(session ? 'ready' : 'missing');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady('ready');
    });
    return () => subscription.unsubscribe();
  }, []);

  const failedRules = PASSWORD_RULES.filter(r => !r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (failedRules.length > 0) {
      setError('Password does not meet the requirements below');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/login', { replace: true }), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mb-8">
          <motion.img src="/mascot.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
          <h1 className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>Reset Password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Choose a new password below</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="d-card">
            {sessionReady === 'checking' && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Verifying your reset link...</p>
            )}

            {sessionReady === 'missing' && (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,75,75,0.12)' }}>
                  <ShieldAlert className="w-7 h-7" style={{ color: 'var(--red)' }} />
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text)' }}>
                  This reset link is invalid or has expired. Please request a new one.
                </p>
                <Link to="/forgot-password" className="d-btn d-btn-md d-btn-green w-full">
                  Request New Link
                </Link>
              </div>
            )}

            {sessionReady === 'ready' && !success && (
              <>
                {error && (
                  <div className="p-3 rounded-2xl text-sm font-bold mb-4 text-center" style={{ backgroundColor: 'rgba(255,75,75,0.12)', color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      autoFocus
                      className="d-input pl-10 pr-10 w-full"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="d-input pl-10 w-full"
                    />
                  </div>

                  <ul className="space-y-1 py-1">
                    {PASSWORD_RULES.map((rule) => {
                      const met = rule.test(password);
                      return (
                        <li key={rule.label} className="flex items-center gap-2 text-xs font-semibold" style={{ color: met ? 'var(--green)' : 'var(--text-muted)' }}>
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ opacity: met ? 1 : 0.4 }} />
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>

                  <button type="submit" disabled={isSubmitting} className="d-btn d-btn-md d-btn-green w-full disabled:opacity-50">
                    {isSubmitting ? 'Updating...' : <>Update Password <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </>
            )}

            {success && (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(88,204,2,0.12)' }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--green)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text)' }}>Password updated! Redirecting you to sign in...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}