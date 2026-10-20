import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient, type Client, type InValue, type ResultSet, type Transaction } from '@libsql/client';

export interface RunResult { changes: number; lastInsertRowid: number }

/**
 * Async SQLite access over libSQL: a local file (dev, tests, local demo) or a hosted Turso database (Vercel).
 * Same SQL, migrations and seed as before. Inside `transaction(fn)`, every query made through this object runs
 * in that transaction (AsyncLocalStorage), so repository code keeps taking `db` and stays unaware of transactions.
 */
export class Database {
  readonly #client: Client;
  readonly #tx = new AsyncLocalStorage<Transaction>();
  // A local file or :memory: has one connection; queue all work on it, as the synchronous driver did.
  // A remote database handles concurrency itself, so only local access is serialized.
  readonly #serialize: boolean;
  #queue: Promise<unknown> = Promise.resolve();

  constructor(client: Client, local: boolean) {
    this.#client = client;
    this.#serialize = local;
    // Per-connection pragma; a remote database is reached over stateless HTTP, so it applies to local files only.
    if (local) void this.#use((c) => c.execute('PRAGMA foreign_keys = ON'));
  }

  #use<T>(fn: (c: Client | Transaction) => Promise<T>): Promise<T> {
    const tx = this.#tx.getStore();
    if (tx) return fn(tx);
    if (!this.#serialize) return fn(this.#client);
    const run = this.#queue.then(() => fn(this.#client));
    this.#queue = run.catch(() => undefined);
    return run;
  }

  async get<T>(sql: string, ...args: InValue[]): Promise<T | undefined> {
    return rows<T>(await this.#use((c) => c.execute({ sql, args })))[0];
  }
  async all<T>(sql: string, ...args: InValue[]): Promise<T[]> {
    return rows<T>(await this.#use((c) => c.execute({ sql, args })));
  }
  async run(sql: string, ...args: InValue[]): Promise<RunResult> {
    const rs = await this.#use((c) => c.execute({ sql, args }));
    return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid ?? 0) };
  }
  /** Several statements without arguments (migrations). */
  async exec(sql: string): Promise<void> {
    await this.#use((c) => c.executeMultiple(sql));
  }

  /** Runs `fn` in one write transaction; nested calls join the outer one. Rolls back if `fn` throws. */
  transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.#tx.getStore()) return fn();
    return this.#use(async (c) => {
      const tx = await (c as Client).transaction('write');
      try {
        const result = await this.#tx.run(tx, fn);
        await tx.commit();
        return result;
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }
    });
  }

  close(): void {
    this.#client.close();
  }
}

function rows<T>(rs: ResultSet): T[] {
  return rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])) as T);
}

/**
 * Accepts ':memory:' (tests), a file path (local SQLite file, unchanged format) or a libsql:// / https:// URL
 * (hosted Turso, with `authToken`).
 */
export function openDatabase(location: string, authToken?: string): Database {
  const remote = /^(libsql|https?|wss?):\/\//.test(location);
  const url = remote || location === ':memory:' || location.startsWith('file:') ? location : `file:${location}`;
  return new Database(createClient({ url, authToken: remote ? authToken : undefined, concurrency: remote ? undefined : 1 }), !remote);
}
