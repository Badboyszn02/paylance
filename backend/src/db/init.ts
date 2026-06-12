// Apply schema.sql to the configured database.
// Usage: npm run db:init
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
await pool.query(sql);
console.log('✓ schema applied');
await pool.end();
