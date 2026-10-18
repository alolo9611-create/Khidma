import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { json, stubFetch, USERS } from '../test/fetchStub';
import { SessionProvider } from './SessionContext';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SessionProvider', () => {
  it('restores the user from /me on reload', async () => {
    stubFetch({ '/api/v1/auth/me': () => json(200, USERS.noura) });
    renderAt('/staff/review');
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Staff review area' })).toBeTruthy();
    expect(screen.getByText('Signed in as Noura Demo')).toBeTruthy();
  });

  it('renders with no user when /me answers 401', async () => {
    stubFetch();
    renderAt('/staff/review');
    expect(await screen.findByRole('heading', { name: 'Staff review area' })).toBeTruthy();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
  });

  it('calls /me exactly once per mount', async () => {
    const fetchMock = stubFetch();
    renderAt('/login');
    await screen.findByLabelText('Email');
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/me')).toHaveLength(1);
  });
});
