/**
 * src/lib/parseCourseMarkdown.ts
 *
 * Parses a .md file into { course, modules: [{ module, lessons: [...] }] }
 *
 * Handles real-world AI-generated markdown variance:
 * - Meta lines can be plain ("slug: x"), bulleted ("- slug: x"), or bold
 *   ("**description:** x") — all normalized before parsing.
 * - Module/Lesson headings can include numbering and separators
 *   ("## Module 1 — Title", "### Lesson 1.1 — Title") — the numbering
 *   prefix is stripped from the captured title automatically.
 * - "#### Lesson Content", "#### Image Prompt", and "#### AI Avatar Script"
 *   sections (or any heading-level variant of them) are recognized by
 *   KEYWORD, not by hashtag count, and Image Prompt / AI Avatar Script
 *   sections are stripped out entirely — they were only ever meant for
 *   internal content generation, not for display on the actual lesson page.
 */

export interface ParsedLesson { title: string; meta: Record<string, string>; content: string; }
export interface ParsedModule { title: string; meta: Record<string, string>; lessons: ParsedLesson[]; }
export interface ParsedCourse { title: string; meta: Record<string, string>; modules: ParsedModule[]; }

// Matches "slug: x", "- slug: x", "* slug: x", "**slug:** x", "- **slug:** x" — all the same thing.
const KV_LINE = /^\s*[-*+]?\s*\*{0,2}([a-zA-Z_]+)\*{0,2}\s*:\s*\*{0,2}\s*(.*?)\s*\*{0,2}\s*$/;

// Heading detectors — keyword-based, level-agnostic (1 to 6 hashtags all count).
const MODULE_HEADING = /^#{1,6}\s*Module\b\s*[\d.]*\s*[—\-:.]?\s*(.*)$/i;
const LESSON_HEADING = /^#{1,6}\s*Lesson\b(?!\s*Content\b)\s*[\d.]*\s*[—\-:.]?\s*(.*)$/i;
const COURSE_HEADING = /^#\s+(.+)$/; // only ever checked on the very first non-empty line

// Sections inside a lesson body we strip entirely before saving (keyword-based,
// so it doesn't matter what heading level the source markdown used).
function cleanBody(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  let skippingSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    // "#### Lesson Content" is just a noise label — drop the line, keep going.
    if (/^#{1,6}\s*Lesson Content\s*$/i.test(trimmed)) continue;
    // Once we hit Image Prompt or AI Avatar Script, everything from here to
    // the end of this lesson's body gets dropped.
    if (/^#{1,6}\s*Image Prompt\s*$/i.test(trimmed) || /^#{1,6}\s*AI Avatar Script\s*$/i.test(trimmed)) {
      skippingSection = true;
      continue;
    }
    if (skippingSection) continue;
    out.push(line);
  }
  return out.join('\n')
    .replace(/^\s*---\s*$/gm, '')      // stray horizontal-rule separator lines
    .replace(/\n{3,}/g, '\n\n')        // collapse excess blank lines left behind
    .trim();
}

export function parseCourseMarkdown(md: string): ParsedCourse {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const course: ParsedCourse = { title: '', meta: {}, modules: [] };
  let curModule: ParsedModule | null = null;
  let curLesson: ParsedLesson | null = null;
  let mode: 'meta' | 'body' = 'meta';
  let bodyLines: string[] = [];
  let seenFirstHeading = false;

  const flushLesson = () => {
    if (curLesson) {
      curLesson.content = cleanBody(bodyLines.join('\n'));
      if (curModule) curModule.lessons.push(curLesson);
    }
    curLesson = null;
    bodyLines = [];
  };
  const flushModule = () => {
    flushLesson();
    if (curModule) course.modules.push(curModule);
    curModule = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Course title: only ever recognized once, as the very first heading in the file.
    if (!seenFirstHeading && COURSE_HEADING.test(trimmed) && !MODULE_HEADING.test(trimmed) && !LESSON_HEADING.test(trimmed)) {
      course.title = trimmed.match(COURSE_HEADING)![1].trim();
      seenFirstHeading = true;
      mode = 'meta';
      continue;
    }

    const modMatch = trimmed.match(MODULE_HEADING);
    if (modMatch) {
      seenFirstHeading = true;
      flushModule();
      curModule = { title: modMatch[1].trim(), meta: {}, lessons: [] };
      mode = 'meta';
      continue;
    }

    const lesMatch = trimmed.match(LESSON_HEADING);
    if (lesMatch) {
      seenFirstHeading = true;
      flushLesson();
      curLesson = { title: lesMatch[1].trim(), meta: {}, content: '' };
      mode = 'meta';
      continue;
    }

    if (mode === 'meta') {
      if (trimmed === '') { continue; } // blank spacing before/between meta lines — stay in meta mode
      if (trimmed === '---') continue; // decorative separator, ignore in meta zone
      const kv = trimmed.match(KV_LINE);
      if (kv) {
        const key = kv[1].toLowerCase();
        const val = kv[2].trim();
        if (curLesson) curLesson.meta[key] = val;
        else if (curModule) curModule.meta[key] = val;
        else course.meta[key] = val;
        continue;
      }
      // Not a recognized meta line and not blank — real content has started.
      mode = 'body';
      bodyLines.push(line);
      continue;
    }

    bodyLines.push(line);
  }
  flushModule();
  return course;
}

export const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');