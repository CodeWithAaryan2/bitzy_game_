import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await requestPasswordReset(email);
    setIsSubmitting(false);

    // Always show the success state, even on failure — this avoids leaking
    // whether an email address has an account (standard auth UX practice).
    if (resetError) {
      // Still show success unless it's a rate-limit / network style error the
      // user should actually know about.
      if (/rate limit|network/i.test(resetError)) {
        setError(resetError);
        return;
      }
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mb-8">
          <motion.img src="/mascot.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
          <h1 className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>Forgot Password?</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {sent ? "Check your inbox for a reset link" : "No worries, we'll send you reset instructions"}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="d-card">
            {sent ? (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(88,204,2,0.12)' }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--green)' }} />
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text)' }}>
                  If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                </p>
                <Link to="/login" className="d-btn d-btn-md d-btn-green w-full">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            ) : (
              <>
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
                      autoFocus
                      className="d-input pl-10 w-full"
                    />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="d-btn d-btn-md d-btn-green w-full disabled:opacity-50">
                    {isSubmitting ? 'Sending...' : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-bold mt-4" style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}