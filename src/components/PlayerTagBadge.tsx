/**
 * src/components/PlayerTagBadge.tsx
 *
 * Renders the small tag pills next to a player's name, wherever their
 * name shows up (leaderboard, public profile, own profile). Three kinds:
 *
 *  - "Admin"     — automatic, whenever profile.role === 'admin'. Not
 *                  stored anywhere extra, just derived from role.
 *  - "#1"        — automatic, whenever this player is rank 1 on the
 *                  global XP leaderboard. Pass `rank={1}` from wherever
 *                  you already know the rank (leaderboard query); this
 *                  component never fetches rank itself.
 *  - custom tag  — whatever an admin typed in for this player from the
 *                  Admin → Players tab (profiles.custom_tag /
 *                  custom_tag_color). Shows only if set.
 *
 * Usage: <PlayerTagBadge role={p.role} rank={entry.rank} tag={p.custom_tag} tagColor={p.custom_tag_color} />
 */
import { Shield, Crown, Sparkles } from 'lucide-react';

export default function PlayerTagBadge({
  role,
  rank,
  tag,
  tagColor,
  size = 'sm',
}: {
  role?: string | null;
  rank?: number | null;
  tag?: string | null;
  tagColor?: string | null;
  size?: 'sm' | 'xs';
}) {
  const isAdmin = role === 'admin';
  const isNumberOne = rank === 1;
  const hasCustomTag = !!tag && tag.trim().length > 0;

  if (!isAdmin && !isNumberOne && !hasCustomTag) return null;

  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';
  const iconSize = size === 'xs' ? 9 : 10;

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {isAdmin && (
        <span className={`inline-flex items-center gap-1 rounded-full font-bold ${pad}`}
          style={{ backgroundColor: '#CE82FF20', color: '#CE82FF' }}>
          <Shield size={iconSize} /> Admin
        </span>
      )}
      {isNumberOne && (
        <span className={`inline-flex items-center gap-1 rounded-full font-bold ${pad}`}
          style={{ backgroundColor: '#FFC80020', color: '#C99A00' }}>
          <Crown size={iconSize} /> #1
        </span>
      )}
      {hasCustomTag && (
        <span className={`inline-flex items-center gap-1 rounded-full font-bold ${pad}`}
          style={{ backgroundColor: (tagColor ?? '#1CB0F6') + '20', color: tagColor ?? '#1CB0F6' }}>
          <Sparkles size={iconSize} /> {tag}
        </span>
      )}
    </span>
  );
}
