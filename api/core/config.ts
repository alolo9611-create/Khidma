export interface AppConfig {
  port: number; jwtSecret: string; timezone: string;
  /** Local SQLite file path, or a hosted libSQL/Turso URL (DATABASE_URL) for serverless hosts like Vercel. */
  databasePath: string;
  /** Turso auth token; only used with a hosted URL. */
  databaseAuthToken: string | null;
  /** Express "trust proxy" value, set only behind a known reverse proxy (per-IP login rate limit, D-10). */
  trustProxy: string | null;
  /** Built SPA (web/dist) to serve from the same origin in production. */
  staticDir: string | null;
  /** Interface to bind; hosts like Render need 0.0.0.0. Unset keeps Node's default (local dev unchanged). */
  host: string | null;
  /** Shared preview-access gate (hosted trial). Off unless PREVIEW_PASSWORD is set. */
  previewGate: { user: string; password: string } | null;
}

const EXAMPLE_SECRET = 'dev-only-change-me-to-a-long-random-string';

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is required');
  if (env.NODE_ENV === 'production' && (jwtSecret === EXAMPLE_SECRET || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be a unique random value of at least 32 characters in production');
  }
  const previewPassword = env.PREVIEW_PASSWORD || null;
  if (previewPassword !== null && previewPassword.length < 16) throw new Error('PREVIEW_PASSWORD must be at least 16 characters');
  return {
    port: Number(env.PORT ?? 3000),
    jwtSecret,
    databasePath: env.DATABASE_URL || env.DATABASE_PATH || '../db/khidma.sqlite',
    databaseAuthToken: env.DATABASE_AUTH_TOKEN || null,
    // PRD §01: "one timezone everywhere (config, default Asia/Riyadh)".
    timezone: env.TIMEZONE ?? 'Asia/Riyadh',
    trustProxy: env.TRUST_PROXY || null,
    staticDir: env.STATIC_DIR || null,
    host: env.HOST || null,
    previewGate: previewPassword ? { user: env.PREVIEW_USER || 'khidma', password: previewPassword } : null,
  };
}
