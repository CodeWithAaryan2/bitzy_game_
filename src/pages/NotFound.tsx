import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
          <img src="/mascot.png" alt="" className="w-24 h-24 mx-auto object-contain opacity-50" />
        </motion.div>
        <h1 className="font-display text-4xl font-black mb-2" style={{ color: 'var(--text)' }}>404</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>This page wandered off! Let&apos;s get you back.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate('/')} className="d-btn d-btn-md d-btn-green mx-auto">
            <Home className="w-4 h-4" /> Back to Home
          </button>
          <button onClick={() => navigate(-1)} className="d-btn d-btn-sm d-btn-ghost mx-auto">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
