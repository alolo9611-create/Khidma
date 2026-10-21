import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { json, me, stubFetch, USERS } from '../test/fetchStub';
import { renderAt } from '../test/render';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const ITEMS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1, message: `Request KH-2026-${String(i + 1).padStart(6, '0')} was approved.`, link: `/applicant/requests/${i + 1}`,
  readAt: i % 2 ? '2026-10-20T08:00:00Z' : null, createdAt: '2026-10-20T07:00:00Z',
}));

describe('notifications panel (F-19)', () => {
  it('lists every notification in one scrollable list anchored to the top-bar actions; clicking one marks it read and opens it', async () => {
    const fetchMock = stubFetch({
      '/api/v1/auth/me': me(USERS.faisal),
      '/api/v1/notifications': () => json(200, { unread: 10, items: ITEMS }),
      '/api/v1/notifications/20/read': () => json(200, { id: 20, link: '/applicant/requests/20' }),
    });
    renderAt('/applicant');
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 10 unread' }));

    const panel = screen.getByRole('region', { name: 'Notifications' });
    expect(within(panel).getByRole('heading', { name: 'Notifications' })).toBeTruthy();
    expect(within(panel).getByText('10 unread')).toBeTruthy();
    const list = panel.querySelector('.k-pop-list')!;
    expect(within(list as HTMLElement).getAllByRole('link')).toHaveLength(20); // all of them, in the scrolling list
    // Regression: a positioned 40 px bell wrapper made `max-width:100%` squeeze the panel to the bell's width.
    expect(panel.closest('.k-top-actions')).toBeTruthy();
    expect((panel.parentElement as HTMLElement).style.position).toBe('');

    await userEvent.click(within(panel).getByRole('link', { name: /KH-2026-000020/ }));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/applicant/requests/20'));
    expect(fetchMock.mock.calls.some(([url, init]) => url === '/api/v1/notifications/20/read' && init?.method === 'POST')).toBe(true);
    expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull();
  });

  it('closes on a click outside the panel', async () => {
    stubFetch({ '/api/v1/auth/me': me(USERS.faisal), '/api/v1/notifications': () => json(200, { unread: 10, items: ITEMS }) });
    renderAt('/applicant');
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 10 unread' }));
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull();
  });
});
