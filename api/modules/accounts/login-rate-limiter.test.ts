import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../test/helpers.js';
import { createLoginRateLimiter } from './login-rate-limiter.js';

const MIN = 60 * 1000;

function setup() {
  const clock = fakeClock(new Date('2026-01-01T00:00:00Z'));
  return { clock, limiter: createLoginRateLimiter(clock) };
}

describe('login rate limiter', () => {
  it('is not blocked after 4 failures', () => {
    const { limiter } = setup();
    for (let i = 0; i < 4; i++) limiter.recordFailure('a');
    expect(limiter.isBlocked('a')).toBe(false);
  });

  it('is blocked after 5 failures', () => {
    const { limiter } = setup();
    for (let i = 0; i < 5; i++) limiter.recordFailure('a');
    expect(limiter.isBlocked('a')).toBe(true);
  });

  it('unblocks once the window has passed', () => {
    const { clock, limiter } = setup();
    for (let i = 0; i < 5; i++) limiter.recordFailure('a');
    clock.advance(15 * MIN + 1);
    expect(limiter.isBlocked('a')).toBe(false);
  });

  it('keeps keys independent', () => {
    const { limiter } = setup();
    for (let i = 0; i < 5; i++) limiter.recordFailure('a');
    expect(limiter.isBlocked('a')).toBe(true);
    expect(limiter.isBlocked('b')).toBe(false);
  });

  it('uses a sliding window', () => {
    const { clock, limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.recordFailure('a');
    clock.advance(10 * MIN);
    for (let i = 0; i < 2; i++) limiter.recordFailure('a');
    expect(limiter.isBlocked('a')).toBe(true);
    clock.advance(5 * MIN + 1);
    expect(limiter.isBlocked('a')).toBe(false);
  });
});
