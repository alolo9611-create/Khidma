import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { SessionProvider } from '../session/SessionContext';
import { json, stubFetch, USERS } from '../test/fetchStub';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PlaceholderArea', () => {
  it('signs out, clears the session and returns to /login', async () => {
    const fetchMock = stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.noura),
      '/api/v1/auth/logout': () => json(204),
    });
    render(
      <MemoryRouter initialEntries={['/staff/review']}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Signed in as Noura Demo')).toBeTruthy();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/v1/auth/logout')!;
    expect(call[1]?.method).toBe('POST');
  });
});
