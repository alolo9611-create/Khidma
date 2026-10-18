export interface AppConfig { port: number; jwtSecret: string; databasePath: string }

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is required');
  return {
    port: Number(env.PORT ?? 3000),
    jwtSecret,
    databasePath: env.DATABASE_PATH ?? '../db/khidma.sqlite',
  };
}
