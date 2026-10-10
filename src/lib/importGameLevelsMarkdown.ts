/**
 * src/lib/importGameLevelsMarkdown.ts
 *
 * Parses a Markdown file describing Game Levels and imports every level into
 * the `game_levels` table in one click — mirrors the existing
 * `importCourseMarkdown.ts` pattern used on the Courses tab.
 *
 * Imported levels are always created PRIVATE (is_published: false), exactly
 * like every other admin-created item — publish them manually from the
 * Game Levels tab once you've checked them over.
 *
 * Levels are appended in the order they appear in the file, continuing on
 * from whatever the current highest `order` value already is — so you can
 * just keep uploading more .md files and new levels always land at the end
 * ("their position") without clobbering anything already published.
 * You can also set an explicit `order:` field on a level to pin it to a
 * specific position instead.
 *
 * ───────────────────────────────────────────────────────────────────────
 * MARKDOWN FORMAT
 * ───────────────────────────────────────────────────────────────────────
 *
 * # Game Levels Import              <- optional file title, ignored
 *
 * ## Level
 * title: JavaScript Basics — Round 1
 * topic: javascript
 * difficulty: Easy
 * game_type: quiz
 * xp_reward: 50
 * coin_reward: 25
 * order: 1                          <- optional, auto-assigned if omitted
 *
 * ### Item
 * question: What does console.log() do?
 * options: Prints to console | Deletes a variable | Returns a value | Does nothing
 * correctIndex: 0
 * explanation: console.log() outputs text to the console for debugging.
 *
 * ## Level
 * title: Speed Typing — Java Basics
 * topic: java
 * difficulty: Easy
 * game_type: typing
 * xp_reward: 40
 * coin_reward: 20
 *
 * ### Item
 * ```code
 * System.out.println("Hello, World!");
 * ```
 * language: java
 *
 * ───────────────────────────────────────────────────────────────────────
 * FIELD CHEATSHEET — what to put inside each "### Item" block, per game_type
 * ───────────────────────────────────────────────────────────────────────
 *   quiz        -> question, options (pipe-separated), correctIndex, explanation
 *   fillblank   -> template, answer, hint
 *   prediction  -> ```code fenced block```, output, explanation
 *   bughunt     -> ```code fenced block```, bugLine, explanation
 *   codeorder   -> lines (pipe-separated, already in the CORRECT order), hint
 *   truthy      -> statement, isTrue (true/false), explanation
 *   coderace    -> template, answer, hint
 *   typing      -> ```code fenced block``` (the snippet to type), language
 *
 * Unknown/custom game_types fall back to passing through whatever key: value
 * pairs were found in the item block, so you're never fully blocked.
 * ───────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/lib/supabase';

interface ParsedItem { [key: string]: any }

interface ParsedLevel {
  title: string;
  topic: string;
  difficulty: string;
  game_type: string;
  xp_reward: number;
  coin_reward: number;
  order?: number;
  items: ParsedItem[];
}

const DEFAULTS = {
  topic: 'general',
  difficulty: 'Easy',
  game_type: 'quiz',
  xp_reward: 50,
  coin_reward: 25,
};

/** Pull `key: value` lines out of a level block, stopping before the first "### Item". */
function parseLevelMeta(block: string): Record<string, string> {
  const metaSection = block.split(/\n###\s*Item\b/i)[0];
  const meta: Record<string, string> = {};
  for (const line of metaSection.split('\n')) {
    const m = line.match(/^([A-Za-z_]+)\s*:\s*(.+)$/);
    if (m) meta[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return meta;
}

/** Extract the first fenced ```code ... ``` (or ```js / ```python etc.) block's contents. */
function extractCodeFence(block: string): string {
  const m = block.match(/```(?:code|js|javascript|ts|typescript|python|py|java|c|cpp|c\+\+|[\w-]*)\n([\s\S]*?)```/i);
  return m ? m[1].replace(/\n$/, '') : '';
}

/** Pull `key: value` lines out of an item block, ignoring anything inside a fenced code block. */
function parseItemFields(itemBlock: string): Record<string, string> {
  const withoutCode = itemBlock.replace(/```[\s\S]*?```/g, '');
  const fields: Record<string, string> = {};
  for (const line of withoutCode.split('\n')) {
    const m = line.match(/^([A-Za-z_]+)\s*:\s*(.+)$/);
    if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return fields;
}

function splitPipeList(v: string | undefined): string[] {
  return (v ?? '').split('|').map(s => s.trim()).filter(Boolean);
}

function buildItem(gameType: string, itemBlock: string, index: number): ParsedItem {
  const f = parseItemFields(itemBlock);
  const id = `q${index + 1}`;

  switch (gameType) {
    case 'quiz':
      return {
        id,
        question: f.question ?? '',
        options: splitPipeList(f.options),
        correctIndex: Number(f.correctindex ?? 0),
        explanation: f.explanation ?? '',
      };
    case 'fillblank':
      return {
        id,
        template: f.template ?? '',
        answer: f.answer ?? '',
        hint: f.hint ?? '',
      };
    case 'prediction':
      return {
        id,
        code: extractCodeFence(itemBlock),
        output: f.output ?? '',
        explanation: f.explanation ?? '',
      };
    case 'bughunt':
      return {
        id,
        code: extractCodeFence(itemBlock),
        bugLine: Number(f.bugline ?? 1),
        explanation: f.explanation ?? '',
      };
    case 'codeorder':
      return {
        id,
        lines: splitPipeList(f.lines),
        hint: f.hint ?? '',
      };
    case 'truthy':
      return {
        id,
        statement: f.statement ?? '',
        isTrue: /^true$/i.test(f.istrue ?? 'true'),
        explanation: f.explanation ?? '',
      };
    case 'coderace':
      return {
        id,
        template: f.template ?? '',
        answer: f.answer ?? '',
        hint: f.hint ?? '',
      };
    case 'typing':
      // NEW: was previously unsupported entirely — fell through to the
      // generic default case below, which doesn't extract fenced code at
      // all (parseItemFields explicitly strips ``` blocks before reading
      // key:value lines). SpeedTypingGame needs the actual code snippet
      // text, so this needs its own case calling extractCodeFence().
      return {
        id,
        code: extractCodeFence(itemBlock),
        language: f.language ?? 'javascript',
      };
    default:
      // Unknown game_type: pass through whatever fields were found
      return { id, ...f };
  }
}

/** Pure parser — no network calls. Useful for previewing/testing before import. */
export function parseGameLevelsMarkdown(markdown: string): ParsedLevel[] {
  const levelBlocks = markdown.split(/\n##\s*Level\b/i).slice(1); // drop content before the first "## Level"
  const levels: ParsedLevel[] = [];

  for (const raw of levelBlocks) {
    const meta = parseLevelMeta(raw);
    if (!meta.title) continue; // skip malformed/empty blocks

    const itemBlocks = raw.split(/\n###\s*Item\b/i).slice(1);
    const gameType = (meta.game_type ?? DEFAULTS.game_type).toLowerCase();
    const items = itemBlocks.map((block, i) => buildItem(gameType, block, i));

    levels.push({
      title: meta.title,
      topic: meta.topic ?? DEFAULTS.topic,
      difficulty: meta.difficulty ?? DEFAULTS.difficulty,
      game_type: gameType,
      xp_reward: Number(meta.xp_reward ?? DEFAULTS.xp_reward),
      coin_reward: Number(meta.coin_reward ?? DEFAULTS.coin_reward),
      order: meta.order ? Number(meta.order) : undefined,
      items,
    });
  }

  return levels;
}

/**
 * Parses the markdown and inserts every level into `game_levels`.
 * Returns { ok, message } exactly like importCourseMarkdown, so it can be
 * wired into the same toast/refresh pattern used elsewhere in the admin panel.
 */
export async function importGameLevelsMarkdown(markdown: string): Promise<{ ok: boolean; message: string }> {
  let levels: ParsedLevel[];
  try {
    levels = parseGameLevelsMarkdown(markdown);
  } catch (err: any) {
    return { ok: false, message: 'Could not parse markdown: ' + err.message };
  }

  if (levels.length === 0) {
    return { ok: false, message: 'No "## Level" blocks found in this file. Check the format and try again.' };
  }

  for (const lvl of levels) {
    if (lvl.items.length === 0) {
      return { ok: false, message: `Level "${lvl.title}" has no "### Item" blocks — nothing to import for it.` };
    }
  }

  // Find the current highest order so new levels are appended, not overwritten
  const { data: existing, error: fetchErr } = await supabase
    .from('game_levels')
    .select('order')
    .order('order', { ascending: false })
    .limit(1);

  if (fetchErr) {
    return { ok: false, message: 'Could not read existing levels: ' + fetchErr.message };
  }

  let nextOrder = (existing?.[0]?.order ?? 0) + 1;

  const rows = levels.map((lvl) => {
    const row = {
      title: lvl.title,
      topic: lvl.topic,
      difficulty: lvl.difficulty,
      game_type: lvl.game_type,
      questions: JSON.stringify(lvl.items),
      xp_reward: lvl.xp_reward,
      coin_reward: lvl.coin_reward,
      order: lvl.order ?? nextOrder,
      is_published: false,
    };
    if (lvl.order === undefined) nextOrder += 1;
    return row;
  });

  const { error: insertErr } = await supabase.from('game_levels').insert(rows);
  if (insertErr) {
    return { ok: false, message: 'Import failed: ' + insertErr.message };
  }

  const totalItems = levels.reduce((sum, l) => sum + l.items.length, 0);
  return {
    ok: true,
    message: `Imported ${rows.length} game level${rows.length === 1 ? '' : 's'} (${totalItems} question${totalItems === 1 ? '' : 's'} total)! Private — publish from the Game Levels tab.`,
  };
}