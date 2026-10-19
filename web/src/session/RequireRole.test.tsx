import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { json, stubFetch, USERS } from '../test/fetchStub';
import { renderAt } from '../test/render';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('role guards (F-02, BR-18, PQ-08)', () => {
  it.each([
    ['faisal', '/staff/review', '/applicant'],
    ['noura', '/applicant', '/staff/review'],
    ['noura', '/staff/supervisor', '/staff/review'],
    ['khalid', '/applicant/requests/1', '/staff/supervisor'],
  ])('%s opening %s is sent to their own area %s', async (who, from, to) => {
    stubFetch({ '/api/v1/auth/me': () => json(200, USERS[who]) });
    renderAt(from);
    await vi.waitFor(() => expect(screen.getByTestId('path').textContent).toBe(to));
  });

  it('supervisors can open the queue as well as the dashboard', async () => {
    stubFetch({ '/api/v1/auth/me': () => json(200, USERS.khalid) });
    renderAt('/staff/review');
    expect(await screen.findByRole('heading', { name: 'Licensing queue' })).toBeTruthy();
  });

  it('signs out from the account menu and returns to /login', async () => {
    const fetchMock = stubFetch({ '/api/v1/auth/me': () => json(200, USERS.faisal), '/api/v1/auth/logout': () => new Response(null, { status: 204 }) });
    renderAt('/applicant');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in to Khidma' })).toBeTruthy();
    expect(fetchMock.mock.calls.find(([u]) => u === '/api/v1/auth/logout')?.[1]?.method).toBe('POST');
  });
});
