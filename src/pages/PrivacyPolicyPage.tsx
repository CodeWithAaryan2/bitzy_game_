import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, Mail, MessageCircle, Lock, Database,
  Cookie, UserCheck, Send, CheckCircle2,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: Database,
    title: '1. Information We Collect',
    color: '#2B7FFF',
    body: `We collect only what's needed to run Bitzy:
• Account info — name, email, password (encrypted)
• Progress data — XP, streaks, completed lessons, badges, quiz scores
• Usage data — pages visited, games played, time spent (to improve the app)

We do NOT collect or sell your personal data to advertisers or third parties.`,
  },
  {
    icon: Lock,
    title: '2. How We Use Your Information',
    color: '#58CC02',
    body: `Your data is used to:
• Track your learning progress, XP, and streaks
• Show your rank on the leaderboard
• Personalize course recommendations
• Send important account or security notifications

Sub AI (our coding mentor) runs 100% locally on your device — your chat messages
are never sent to any external AI server or third-party API.`,
  },
  {
    icon: Shield,
    title: '3. Data Security',
    color: '#FF9600',
    body: `We take security seriously:
• Passwords are hashed and never stored in plain text
• All data is transmitted over secure HTTPS connections
• Access to your account requires authentication
• We regularly review our systems for vulnerabilities

While we work hard to protect your data, no system is 100% secure — please use a
strong, unique password.`,
  },
  {
    icon: Cookie,
    title: '4. Cookies & Local Storage',
    color: '#CE82FF',
    body: `Bitzy uses cookies and local storage to:
• Keep you logged in
• Remember your theme preference (light/dark)
• Save your progress between sessions

You can clear cookies anytime via your browser settings, but this may log you out
or reset some preferences.`,
  },
  {
    icon: UserCheck,
    title: '5. Your Rights',
    color: '#FF4B4B',
    body: `You have the right to:
• Access the personal data we hold about you
• Request correction of inaccurate data
• Request deletion of your account and associated data
• Export your progress data

To exercise any of these rights, contact us using the form below or email us
directly — we'll respond within a reasonable time.`,
  },
  {
    icon: Shield,
    title: "6. Children's Privacy",
    color: '#1CB0F6',
    body: `Bitzy is designed to be safe for learners of all ages, including teenagers.
If you are under 13 (or the minimum age in your region), please use Bitzy with
the involvement of a parent or guardian. We do not knowingly collect more
information from children than is necessary to provide the service.`,
  },
  {
    icon: MessageCircle,
    title: '7. Changes to This Policy',
    color: '#58CC02',
    body: `We may update this Privacy Policy occasionally to reflect changes in our app
or legal requirements. We'll notify users of significant changes via the app or
email. Continued use of Bitzy after changes means you accept the updated policy.

Last updated: June 2026`,
  },
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const errs: { [k: string]: string } = {};
    if (!form.name.trim()) errs.name = 'Please enter your name';
    if (!form.email.trim()) errs.email = 'Please enter your email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.message.trim()) errs.message = 'Please enter a message';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Build a mailto link as a lightweight, backend-free fallback
    const subject = encodeURIComponent(`Bitzy Support Request from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:bitzygamingapp@gmail.com?subject=${subject}&body=${body}`;

    setSent(true);
    setForm({ name: '', email: '', message: '' });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-10 backdrop-blur-sm" style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => navigate('/')}
          className="d-btn d-btn-sm d-btn-ghost"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: '#2B7FFF' }} />
          <span className="font-display text-lg font-black" style={{ color: 'var(--text)' }}>
            Privacy &amp; Support
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--text)' }}>
            Privacy Policy
          </h1>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Your trust matters to us. Here's exactly how Bitzy handles your data —
            written in plain language, no legal jargon.
          </p>
        </motion.div>

        {/* Policy sections */}
        <div className="space-y-4 mb-12">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 sm:p-5"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: section.color + '15' }}
                >
                  <section.icon className="w-4.5 h-4.5" style={{ color: section.color }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-black text-base mb-2" style={{ color: 'var(--text)' }}>
                    {section.title}
                  </h2>
                  <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {section.body}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact / Support section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5 sm:p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5" style={{ color: '#2B7FFF' }} />
            <h2 className="font-display text-xl font-black" style={{ color: 'var(--text)' }}>
              Contact Support
            </h2>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Got a question, found a bug, or want to share feedback? Reach out — we'd love to hear from you.
          </p>

          {/* Quick contact info */}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#58CC02' }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email</p>
                <a href="mailto:support@bitzy.app" className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  bitzygamingapp@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
              <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FF9600' }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Response Time</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Within 24-48 hours</p>
              </div>
            </div>
          </div>

          {/* Form */}
          {sent ? (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#58CC0215', border: '1px solid #58CC0240' }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#58CC02' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                Your email client should now open with your message pre-filled. If it didn't, email us directly at support@bitzy.app.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text)' }}>Your Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Aaryan Pandey"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: `1px solid ${errors.name ? '#FF4B4B' : 'var(--border)'}`,
                      color: 'var(--text)',
                    }}
                  />
                  {errors.name && <p className="text-xs mt-1" style={{ color: '#FF4B4B' }}>{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text)' }}>Your Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: `1px solid ${errors.email ? '#FF4B4B' : 'var(--border)'}`,
                      color: 'var(--text)',
                    }}
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#FF4B4B' }}>{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text)' }}>Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us what's up — bug report, question, feedback..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 resize-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: `1px solid ${errors.message ? '#FF4B4B' : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}
                />
                {errors.message && <p className="text-xs mt-1" style={{ color: '#FF4B4B' }}>{errors.message}</p>}
              </div>

              <button type="submit" className="d-btn d-btn-green w-full sm:w-auto">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </motion.div>

        <p className="text-center text-xs mt-10" style={{ color: 'var(--text-muted)' }}>
          Bitzy — Gamified Coding Platform · © 2026 Bitzy. All rights reserved.
        </p>
      </main>
    </div>
  );
}
