/**
 * src/hooks/useGameProgress.ts
 * Universal per-game resume hook. Pass any gameName (matches the ActiveGame
 * id used in GamesPage, e.g. 'quiz', 'bughunt', 'coderace') — works for any
 * current or future game with zero changes here.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  loadGameProgress, saveGameProgress, loadAllGameProgress,
  type SaveGameProgressInput,
} from '@/lib/gamification';
import type { Database } from '@/types/database';

type GameProgressRow = Database['public']['Tables']['game_progress']['Row'];

/** Progress for ONE game — use inside the game screen itself. */
export function useGameProgress(gameName: string | null) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<GameProgressRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user || !gameName) { setProgress(null); setLoading(false); return; }
    setLoading(true);
    loadGameProgress(user.id, gameName).then(p => { if (!cancelled) { setProgress(p); setLoading(false); } });
    return () => { cancelled = true; };
  }, [user, gameName]);

  const recordAttempt = useCallback(async (input: SaveGameProgressInput) => {
    if (!user || !gameName) return null;
    const updated = await saveGameProgress(user.id, gameName, input);
    if (updated) setProgress(updated);
    return updated;
  }, [user, gameName]);

  return { progress, loading, recordAttempt };
}

/** Progress for EVERY game at once — use on the games menu so each card
 *  can show "Continue Level X" vs "Start Game" from a single query. */
export function useAllGameProgress() {
  const { user } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, GameProgressRow>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) { setProgressMap({}); setLoading(false); return; }
    setLoading(true);
    const map = await loadAllGameProgress(user.id);
    setProgressMap(map);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  return { progressMap, loading, reload };
}
