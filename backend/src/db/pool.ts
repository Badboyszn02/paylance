import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config.js';

const { Pool, types } = pg;

// BIGINT (OID 20) as JS number so id === req.user.id works (IDs are well under 2^53).
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));

// Short idle timeout: Railway proxies drop idle TCP connections aggressively.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 8_000,
  keepAlive: true,
});

// Bound query/transaction time per session so a runaway query dies on its own.
pool.on('connect', (client) => {
  client.query(
    "SET statement_timeout = '10s'; SET idle_in_transaction_session_timeout = '30s';"
  ).catch((err) => console.error('[db] failed to set session timeouts', err.message));
});

pool.on('error', (err) => {
  console.error('[db] idle client error (will be replaced)', err.message);
});

// Auto retry once on a dead connection (ECONNRESET / read errors from a stale socket).
const isRetryable = (err: unknown): boolean => {
  const code = (err as { code?: string })?.code;
  return code === 'ECONNRESET' || code === 'EPIPE' || code === 'ETIMEDOUT' || code === '57P01';
};

const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS || 2000);

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    return await pool.query<T>(text, params as never);
  } catch (err) {
    if (isRetryable(err)) {
      return await pool.query<T>(text, params as never);
    }
    throw err;
  } finally {
    const ms = Date.now() - start;
    if (ms > SLOW_QUERY_MS) {
      const preview = text.replace(/\s+/g, ' ').slice(0, 120);
      console.warn(`[db] slow query ${ms}ms :: ${preview}`);
    }
  }
};

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Exposed for /health so operators can see pool pressure live.
export const poolStats = () => ({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount,
});

export const dbPing = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};
