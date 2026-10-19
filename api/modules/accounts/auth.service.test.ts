import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../core/db/connection.js';
import { ProblemError } from '../../core/problem.js';
import { fakeClock, seededDb, TEST_SECRET } from '../../test/helpers.js';
import { authenticate, resolveSession } from './auth.service.js';

const START = new Date('2026-01-01T09:00:00Z');
const D6_KEYS = ['id', 'name', 'email', 'role', 'departmentId'];

let db: Database;
beforeAll(async () => { db = await seededDb(); });

const deps = (clock = fakeClock(START)) => ({ db, clock, jwtSecret: TEST_SECRET });

async function rejection(p: Promise<unknown> | (() => unknown)): Promise<ProblemError> {
  try {
    await (typeof p === 'function' ? p() : p);
  } catch (err) {
    expect(err).toBeInstanceOf(ProblemError);
    return err as ProblemError;
  }
  throw new Error('expected a ProblemError');
}

describe('authenticate', () => {
  it.each([
    ['faisal@khidma.test', 'APPLICANT'],
    ['noura@khidma.test', 'REVIEWER'],
    ['khalid@khidma.test', 'SUPERVISOR'],
  ])('signs in %s and returns the D-6 fields only', async (email, role) => {
    const { user } = await authenticate(deps(), email, 'Passw0rd!');
    expect(Object.keys(user)).toEqual(D6_KEYS);
    expect(user.role).toBe(role);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const wrong = await rejection(authenticate(deps(), 'noura@khidma.test', 'nope'));
    const unknown = await rejection(authenticate(deps(), 'nobody@khidma.test', 'Passw0rd!'));
    for (const e of [wrong, unknown]) {
      expect(e.status).toBe(401);
      expect(e.code).toBe('INVALID_CREDENTIALS');
    }
    expect(wrong.title).toBe(unknown.title);
  });

  it('issues a 1-hour HS256 JWT stamped with the injected clock', async () => {
    const { token } = await authenticate(deps(), 'noura@khidma.test', 'Passw0rd!');
    const clockTimestamp = START.getTime() / 1000;
    const payload = jwt.verify(token, TEST_SECRET, { clockTimestamp }) as jwt.JwtPayload;
    expect(payload.sub).toBe('3');
    expect(payload.role).toBe('REVIEWER');
    expect(payload.iat).toBe(clockTimestamp);
    expect(payload.exp! - payload.iat!).toBe(3600);
    expect(() => jwt.verify(token, TEST_SECRET, { clockTimestamp: clockTimestamp + 3601 })).toThrow();
  });
});

describe('resolveSession', () => {
  it('returns exactly the D-6 fields for a valid token', async () => {
    const { token } = await authenticate(deps(), 'noura@khidma.test', 'Passw0rd!');
    expect(Object.keys(resolveSession(deps(), token))).toEqual(D6_KEYS);
  });

  it('rejects missing, invalid, foreign, expired and orphaned tokens with 401 UNAUTHENTICATED', async () => {
    const clock = fakeClock(START);
    const { token } = await authenticate(deps(clock), 'noura@khidma.test', 'Passw0rd!');
    const iat = START.getTime() / 1000;
    const foreign = jwt.sign({ sub: '3', role: 'REVIEWER', iat }, 'other-secret', { expiresIn: 3600 });
    const orphan = jwt.sign({ sub: '999', role: 'REVIEWER', iat }, TEST_SECRET, { expiresIn: 3600 });

    const expiredClock = fakeClock(START);
    expiredClock.advance(3600 * 1000 + 1000);

    const cases: [ReturnType<typeof deps>, string | undefined][] = [
      [deps(clock), undefined],
      [deps(clock), ''],
      [deps(clock), 'garbage'],
      [deps(clock), foreign],
      [deps(expiredClock), token],
      [deps(clock), orphan],
    ];
    for (const [d, t] of cases) {
      const e = await rejection(() => resolveSession(d, t));
      expect(e.status).toBe(401);
      expect(e.code).toBe('UNAUTHENTICATED');
    }
  });
});
