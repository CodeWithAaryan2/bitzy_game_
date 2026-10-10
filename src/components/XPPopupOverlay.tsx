import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Coins, Trophy, Star, TrendingUp } from 'lucide-react';
import type { XPPopup } from '@/types';

interface Props {
  popups: XPPopup[];
  onDismiss: (id: string) => void;
}

const typeConfig = {
  xp: { icon: Zap, color: '#FFC800', bg: 'rgba(255,200,0,0.12)', border: '#FFE8A0' },
  coin: { icon: Coins, color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)', border: '#B8E8FD' },
  streak: { icon: TrendingUp, color: '#FF9600', bg: 'rgba(255,150,0,0.12)', border: '#FFD9A0' },
  achievement: { icon: Trophy, color: '#CE82FF', bg: 'rgba(206,130,255,0.12)', border: '#E0C8FA' },
  level: { icon: Star, color: '#58CC02', bg: 'rgba(88,204,2,0.12)', border: '#D4EDBC' },
};

export default function XPPopupOverlay({ popups, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {popups.map((popup, index) => {
          const config = typeConfig[popup.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border-2 min-w-[240px]"
              style={{ backgroundColor: config.bg, borderColor: config.border, marginBottom: index * 4 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.border }}>
                <Icon className="w-5 h-5" style={{ color: config.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: config.color }}>
                  {popup.type === 'level' ? popup.message : `+${popup.amount}`}
                </p>
                {popup.type !== 'level' && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{popup.message}</p>
                )}
              </div>
              <button onClick={() => onDismiss(popup.id)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}