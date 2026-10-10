export type BugCategory = 'syntax' | 'loops' | 'conditions' | 'indexing' | 'logic';

export interface BugFinding {
  category: BugCategory;
  title: string;
  english: string;
  hinglish: string;
  line: number;
  confidence: 'likely';
  assessmentId: string;
}

const RULES: { category: BugCategory; title: string; assessmentId: string; pattern: RegExp; english: string; hinglish: string }[] = [
  { category: 'syntax', title: 'Incomplete assignment', assessmentId: 'detective-syntax', pattern: /(?:const|let|var)\s+[\w$]+\s*=\s*(?:;|$)/m, english: 'This assignment appears to be missing its value after `=`.', hinglish: '`=` ke baad value missing lag rahi hai; assignment ko complete karo.' },
  { category: 'loops', title: 'Possible off-by-one loop', assessmentId: 'detective-loop', pattern: /for\s*\([^;]*;\s*[\w$]+\s*<=\s*[\w$]+\.length\s*;/, english: 'Using `<= array.length` can read one index past the end. Check whether `<` is intended.', hinglish: '`<= array.length` ek extra index tak ja sakta hai. Check karo ki `<` chahiye ya nahi.' },
  { category: 'conditions', title: 'Assignment inside condition', assessmentId: 'detective-condition', pattern: /if\s*\([^)]*(?<![=!<>])=(?!=)[^)]*\)/, english: 'A single `=` assigns a value. If you meant to compare, use `===` or another comparison operator.', hinglish: 'Single `=` value assign karta hai. Compare karna tha to `===` ya sahi comparison operator use karo.' },
  { category: 'indexing', title: 'Index may be one past the end', assessmentId: 'detective-index', pattern: /\b[\w$]+\s*\[\s*[\w$]+\.length\s*\]/, english: 'Array indexes start at zero, so `array[array.length]` is outside the array. For the last element use `length - 1`.', hinglish: 'Array index zero se start hota hai; `array[array.length]` bahar hai. Last item ke liye `length - 1` use karo.' },
  { category: 'logic', title: 'Check the boolean operator', assessmentId: 'detective-logic', pattern: /\bif\s*\([^)]*&&[^)]*\)/, english: 'This condition requires both sides to be true. If either condition should be enough, use `||`.', hinglish: 'Yeh condition dono sides true maangti hai. Agar koi ek condition kaafi hai, `||` use karo.' },
];

/** Heuristic-only source scan; it never parses by executing or evaluating user code. */
export function detectCodeMistakes(source: string): BugFinding[] {
  const text = source.slice(0, 12000);
  return RULES.flatMap(rule => {
    const match = rule.pattern.exec(text);
    if (!match || match.index === undefined) return [];
    const line = text.slice(0, match.index).split('\n').length;
    return [{ category: rule.category, title: rule.title, english: rule.english, hinglish: rule.hinglish, line, confidence: 'likely' as const, assessmentId: rule.assessmentId }];
  });
}

export function normalizeAssessmentAnswer(value: string): string {
  return value.toLowerCase().replace(/[\s`;'"{}]/g, '').trim();
}

export function createAssessmentRequestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
