import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Bug, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorFallback({ error, componentStack }: { error: Error; componentStack?: string }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const stackLines = error.stack?.split('\n') || [];
  const sourceLine = stackLines.find(l => l.includes('at ') && !l.includes('ErrorBoundary'));

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center max-w-md w-full">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(255,75,75,0.12)' }}>
          <Bug className="w-8 h-8" style={{ color: '#FF4B4B' }} />
        </motion.div>

        <h1 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Something went wrong</h1>
        <p className="text-sm mb-1 font-bold" style={{ color: '#FF4B4B' }}>{error.message}</p>
        {sourceLine && (
          <p className="text-xs mb-4 font-mono" style={{ color: 'var(--text-muted)' }}>{sourceLine.trim()}</p>
        )}

        <button onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-bold mb-4 flex items-center gap-1 mx-auto"
          style={{ color: '#58CC02' }}>
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showDetails ? 'Hide' : 'Show'} Details
        </button>

        {showDetails && (
          <div className="text-left text-xs font-mono p-3 rounded-2xl mb-4 overflow-auto max-h-48 border-2"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-light)', borderColor: 'var(--border)' }}>
            <p className="font-bold mb-1">Error: {error.message}</p>
            {stackLines.map((line, i) => (
              <p key={i} className="opacity-70">{line}</p>
            ))}
            {componentStack && (
              <>
                <p className="font-bold mt-2 mb-1">Component Stack:</p>
                <p className="opacity-70 whitespace-pre-wrap">{componentStack}</p>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button onClick={handleReset}
            className="d-btn d-btn-md d-btn-red mx-auto">
            <RotateCcw className="w-4 h-4" />
            Clear Data & Reload
          </button>
          <button onClick={() => window.location.reload()}
            className="d-btn d-btn-sm d-btn-ghost mx-auto">
            Just Reload (keep data)
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          This will clear your local progress and refresh the page.
        </p>
      </div>
    </div>
  );
}