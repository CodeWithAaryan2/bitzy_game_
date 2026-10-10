import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database/bitzy.db'));

export interface KnowledgeResult {
  keywords: string[];
  response: string;
}

export function searchKnowledge(query: string): KnowledgeResult | null {
  const rows = db.prepare('SELECT * FROM knowledge').all() as any[];

  const q = query.toLowerCase();

  for (const row of rows) {
    const keywords = JSON.parse(row.keywords) as string[];

    if (keywords.some((k) => q.includes(k.toLowerCase()))) {
      return {
        keywords,
        response: row.response,
      };
    }
  }

  return null;
}