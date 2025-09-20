import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const root = process.cwd();
  const dir = path.join(root, 'migrations');
  if (!fs.existsSync(dir)) return;

  const rows = db
    .prepare("SELECT name FROM _migrations ORDER BY name")
    .all() as Array<{ name: string }>;

  const applied = new Set<string>(rows.map((r) => r.name));

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // ensures 001,002,...

  const tx = db.transaction((sql: string, name: string) => {
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(name);
  });

  for (const name of files) {
    if (applied.has(name)) continue;
    const sql = fs.readFileSync(path.join(dir, name), 'utf8');
    tx(sql, name);
  }
}