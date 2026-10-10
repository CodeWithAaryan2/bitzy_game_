import Database from "better-sqlite3";
import path from "path";
import * as KB from "../src/data/subAiKnowledge";

const db = new Database(path.join(process.cwd(), "database/bitzy.db"));

db.exec(`
DROP TABLE IF EXISTS knowledge;

CREATE TABLE knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keywords TEXT,
  response TEXT
);
`);

// Automatically find the exported KB array
const knowledge =
  Object.values(KB).find((v) => Array.isArray(v)) as any[];

if (!knowledge) {
  throw new Error("❌ No knowledge array found in subAiKnowledge.ts");
}

const insert = db.prepare(`
INSERT INTO knowledge(keywords, response)
VALUES (?, ?)
`);

let count = 0;

for (const item of knowledge) {
  insert.run(
    JSON.stringify(item.keywords),
    item.response.toString()
  );
  count++;
}

console.log(`✅ Imported ${count} KB entries.`);
db.close();