// XP needed to go from (level-1) to level.
// Old curve required 1400 XP (56 lessons!) just to reach Level 5 — felt "stuck".
// New curve: simple linear growth, reaches Level 5 at 340 XP (~14 lessons),
// Level 10 at ~890 XP, Level 20 at ~3100 XP. Smooth and always increasing.
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 + level * 10;
}

export function getLevelFromXP(xp: number): { level: number; currentLevelXP: number; xpToNext: number } {
  let cumulative = 0;
  let level = 1;
  while (level < 200) {
    const needed = getXPForLevel(level + 1);
    if (cumulative + needed > xp) {
      return { level, currentLevelXP: xp - cumulative, xpToNext: needed - (xp - cumulative) };
    }
    cumulative += needed;
    level++;
  }
  return { level: 200, currentLevelXP: 0, xpToNext: 0 };
}
