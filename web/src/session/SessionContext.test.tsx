import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { json, stubFetch, USERS } from '../test/fetchStub';
import { renderAt } from '../test/render';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('SessionProvider', () => {
  it('restores the user from /me on reload', async () => {
    stubFetch({ '/api/v1/auth/me': () => json(200, USERS.noura) });
    renderAt('/staff/review');
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Licensing queue' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Account menu' }).textContent).toContain('Noura');
  });

  it('sends a signed-out visitor of a protected page to /login (F-02)', async () => {
    stubFetch();
    renderAt('/staff/review');
    expect(await screen.findByRole('heading', { name: 'Sign in to Khidma' })).toBeTruthy();
    expect(screen.getByTestId('path').textContent).toBe('/login');
  });

  it('signs the user out when the session expires mid-use (D-3)', async () => {
    stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.faisal),
      '/api/v1/requests/mine': () => json(401, { code: 'UNAUTHENTICATED', title: 'Not signed in.', status: 401 }),
    });
    renderAt('/applicant');
    expect(await screen.findByRole('heading', { name: 'Sign in to Khidma' })).toBeTruthy();
    expect(screen.getByTestId('path').textContent).toBe('/login');
  });

  it('calls /me exactly once per mount', async () => {
    const fetchMock = stubFetch();
    renderAt('/login');
    await screen.findByLabelText('Email');
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/me')).toHaveLength(1);
  });
});
