import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { LANGUAGES } from '@/lib/googleTranslate';

export default function LanguagePicker({
  selected,
  onSelect,
  compact = false,
}: {
  selected: string;
  onSelect: (code: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
      {LANGUAGES.map((lang) => {
        const active = selected === lang.code;
        return (
          <motion.button
            key={lang.code}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(lang.code)}
            className="flex items-center gap-2 p-2.5 rounded-2xl border-2 text-left transition-colors"
            style={{
              borderColor: active ? '#58CC02' : 'var(--border)',
              backgroundColor: active ? 'rgba(88,204,2,0.10)' : 'var(--surface)',
            }}
          >
            <span className="text-lg flex-shrink-0">{lang.flag}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate">{lang.native}</div>
              {!compact && <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{lang.name}</div>}
            </div>
            {active && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#58CC02' }} />}
          </motion.button>
        );
      })}
    </div>
  );
}