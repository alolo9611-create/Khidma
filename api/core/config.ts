export interface AppConfig {
  port: number; jwtSecret: string; databasePath: string; timezone: string;
  /** Express "trust proxy" value, set only behind a known reverse proxy (per-IP login rate limit, D-10). */
  trustProxy: string | null;
  /** Built SPA (web/dist) to serve from the same origin in production. */
  staticDir: string | null;
}

const EXAMPLE_SECRET = 'dev-only-change-me-to-a-long-random-string';

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is required');
  if (env.NODE_ENV === 'production' && (jwtSecret === EXAMPLE_SECRET || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be a unique random value of at least 32 characters in production');
  }
  return {
    port: Number(env.PORT ?? 3000),
    jwtSecret,
    databasePath: env.DATABASE_PATH ?? '../db/khidma.sqlite',
    // PRD §01: "one timezone everywhere (config, default Asia/Riyadh)".
    timezone: env.TIMEZONE ?? 'Asia/Riyadh',
    trustProxy: env.TRUST_PROXY || null,
    staticDir: env.STATIC_DIR || null,
  };
}
