// Ensure the SQLite database is migrated before the server starts.
// Runs as the same user as the server (nodejs), so the dev.db file
// is created with the right ownership.
import { existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL ?? 'file:/data/prisma/dev.db';
const dbPath = DATABASE_URL.replace(/^file:/, '');

try {
  mkdirSync(dirname(dbPath), { recursive: true });
  console.log(`[ensure-db] directory ready: ${dirname(dbPath)}`);
} catch (err) {
  console.error(`[ensure-db] failed to create dir:`, err.message);
  process.exit(1);
}

console.log(`[ensure-db] running prisma migrate deploy on ${dbPath}`);
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL },
  });
  console.log('[ensure-db] migrations applied');
} catch (err) {
  console.error('[ensure-db] migration failed:', err.message);
  process.exit(1);
}
