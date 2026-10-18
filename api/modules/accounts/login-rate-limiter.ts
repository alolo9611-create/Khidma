import type { Clock } from '../../core/clock.js';

export interface LoginRateLimiter {
  isBlocked(key: string): boolean;
  recordFailure(key: string): void;
}

// In-memory sliding window of failure timestamps per key (D-10, Q-14). No timers: pruned on access.
export function createLoginRateLimiter(
  clock: Clock,
  opts = { maxFailures: 5, windowMs: 15 * 60 * 1000 },
): LoginRateLimiter {
  const failures = new Map<string, number[]>();

  function current(key: string): { now: number; recent: number[] } {
    const now = clock.now().getTime();
    const recent = (failures.get(key) ?? []).filter((t) => t > now - opts.windowMs);
    if (recent.length) failures.set(key, recent);
    else failures.delete(key);
    return { now, recent };
  }

  return {
    isBlocked: (key) => current(key).recent.length >= opts.maxFailures,
    recordFailure: (key) => {
      const { now, recent } = current(key);
      failures.set(key, [...recent, now]);
    },
  };
}
