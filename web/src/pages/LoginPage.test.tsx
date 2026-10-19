import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { SessionProvider } from '../session/SessionContext';
import { json, problem, stubFetch, USERS } from '../test/fetchStub';

function LocationProbe() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <SessionProvider>
        <App />
        <LocationProbe />
      </SessionProvider>
    </MemoryRouter>,
  );
}

async function signIn(email: string, password = 'Passw0rd!') {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it.each([
    ['faisal', 'My requests'],
    ['noura', 'Licensing queue'],
    ['khalid', 'Licensing dashboard'],
  ])('signs %s in and lands on %s', async (key, heading) => {
    const fetchMock = stubFetch({ '/api/v1/auth/login': () => json(200, USERS[key]) });
    renderLogin();
    await signIn(USERS[key].email);
    expect(await screen.findByRole('heading', { name: heading })).toBeTruthy();
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/v1/auth/login')!;
    expect(call[1]?.method).toBe('POST');
    expect(JSON.parse(call[1]?.body as string)).toEqual({ email: USERS[key].email, password: 'Passw0rd!' });
  });

  it('shows the problem title on 401 and stays on /login', async () => {
    stubFetch({ '/api/v1/auth/login': () => problem(401, 'INVALID_CREDENTIALS', 'Invalid email or password.') });
    renderLogin();
    await signIn('noura@khidma.test', 'wrong');
    expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password.');
    expect(screen.getByTestId('path').textContent).toBe('/login');
  });

  it('shows the problem title on 429', async () => {
    stubFetch({
      '/api/v1/auth/login': () => problem(429, 'RATE_LIMITED', 'Too many failed login attempts. Try again later.'),
    });
    renderLogin();
    await signIn('noura@khidma.test');
    expect((await screen.findByRole('alert')).textContent).toBe('Too many failed login attempts. Try again later.');
  });

  it('never writes to localStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    stubFetch({ '/api/v1/auth/login': () => json(200, USERS.noura) });
    renderLogin();
    await signIn(USERS.noura.email);
    await screen.findByRole('heading', { name: 'Licensing queue' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('redirects a signed-in user away from /login to their area (PQ-08)', async () => {
    stubFetch({ '/api/v1/auth/me': () => json(200, USERS.faisal) });
    renderLogin();
    expect(await screen.findByRole('heading', { name: 'My requests' })).toBeTruthy();
    expect(screen.getByTestId('path').textContent).toBe('/applicant');
  });

  it('offers no registration, reset or credential hints', async () => {
    stubFetch();
    renderLogin();
    await screen.findByLabelText('Email');
    expect(document.body.textContent).not.toMatch(/register|forgot|reset|Passw0rd/i);
  });
});
