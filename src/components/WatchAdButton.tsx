/**
 * src/components/WatchAdButton.tsx
 *
 * Small reusable gate: "watch a rewarded ad to unlock X". Used for
 * hint-reveal and heart-refill, both of which show a rewarded video before
 * granting the reward. Only calls onReward if the ad actually finished
 * with a reward — closing the ad early gives nothing.
 */
import { useState } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { showRewardedAd } from '@/lib/ads';

interface WatchAdButtonProps {
  adUnitId: string;
  label: string;
  onReward: () => void;
  onNoReward?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function WatchAdButton({
  adUnitId, label, onReward, onNoReward, className, style, disabled,
}: WatchAdButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const earned = await showRewardedAd(adUnitId);
      if (earned) onReward();
      else onNoReward?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={className}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        cursor: loading || disabled ? 'default' : 'pointer',
        opacity: loading || disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
      {loading && label ? 'Loading ad…' : label}
    </button>
  );
}
