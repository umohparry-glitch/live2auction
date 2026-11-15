import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true,
    });

    global._postgresPool.on('error', (err: any) => {
      // Cloud SQL / Auth Proxy routinely closes idle pooled sockets (e.g., scale-to-zero).
      // pg.Pool automatically evicts the dead client and creates a new one on next query.
      const msg = err?.message || '';
      const code = err?.code || '';
      if (
        msg.includes('Connection terminated') ||
        code === 'ECONNRESET' ||
        code === 'EPIPE' ||
        code === 'ETIMEDOUT' ||
        code === '57P01'
      ) {
        return;
      }
      console.warn('SQL pool client notice:', msg || 'Unknown pool error');
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { pool };
