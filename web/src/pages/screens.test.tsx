import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestDetail } from '../api/khidma';
import { json, problem, SERVICES, stubFetch, USERS } from '../test/fetchStub';
import { renderAt } from '../test/render';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const NO_ACTIONS = { edit: false, submit: false, respond: false, withdraw: false, pick: false, assign: false, reassign: false, requestInfo: false, requestInfoLimitReached: false, approve: false, reject: false, comment: false, commentInternal: false };
function detail(over: Partial<RequestDetail> = {}): RequestDetail {
  return {
    id: 7, referenceNo: 'KH-2026-000001', status: 'IN_REVIEW',
    service: { id: 1, code: 'SHOP-LIC', name: 'Shop licence renewal', slaDays: 5, departmentId: 1 },
    fields: SERVICES[0].fields as RequestDetail['fields'], formData: { shopName: 'Demo Cafe' },
    documents: [{ typeCode: 'LEASE_CONTRACT', label: 'Lease contract number', mandatory: true, documentNumber: 'LC-1' }, { typeCode: 'CR_NUMBER', label: 'Commercial registration number', mandatory: true, documentNumber: null }],
    applicant: { id: 1, name: 'Faisal Demo', nationalId: '******0001' }, assignee: { id: 3, name: 'Noura Demo' },
    infoCycles: 0, infoMessage: null, submittedAt: '2026-10-18T07:00:00Z', dueAt: '2026-10-25T20:59:59.999Z', decidedAt: null,
    sla: 'ON_TRACK', workingDaysLeft: 5, dueIfSubmittedNow: null, rejectReason: null, rejectJustification: null, certificate: null,
    timeline: [{ id: 1, action: 'SUBMIT', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', note: null, at: '2026-10-18T07:00:00Z', actorName: 'You', actorRole: 'APPLICANT' }],
    comments: [], actions: NO_ACTIONS, ...over,
  };
}

describe('public screens', () => {
  it('S-03 catalog lists services with SLA and documents; Start request asks a visitor to sign in', async () => {
    stubFetch();
    renderAt('/catalog');
    expect(await screen.findByRole('heading', { name: 'Shop licence renewal' })).toBeTruthy();
    expect(screen.getByText('5 working days')).toBeTruthy();
    expect(screen.getByText('Lease contract number')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Start request' }).getAttribute('href')).toBe('/login');
  });

  it('S-03 landing hero shows the four-step journey and the live service count', async () => {
    stubFetch();
    renderAt('/catalog');
    const hero = within(await screen.findByRole('region', { name: /From request to certificate/ }));
    expect(hero.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(hero.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Submit your request online', 'Get a reference and due date', 'Answer questions in the app', 'Receive the decision and certificate',
    ]);
    expect(hero.getByRole('link', { name: 'Verify a certificate' }).getAttribute('href')).toBe('/verify');
    expect(hero.getByRole('link', { name: 'Start a new request' }).getAttribute('href')).toBe('#services');
    expect(await hero.findByText('1 service available')).toBeTruthy(); // one stub service, singular
  });

  it('S-02 verify shows valid, expired and not found without personal data (BR-17)', async () => {
    stubFetch({
      '/api/v1/verify/SHOP-LIC-2026-00001': () => json(200, { certificateNo: 'SHOP-LIC-2026-00001', service: { name: 'Shop licence renewal' }, status: 'VALID', issuedOn: '2026-10-18', validUntil: '2027-10-17' }),
      '/api/v1/verify/EVENT-PMT-2025-00008': () => json(200, { certificateNo: 'EVENT-PMT-2025-00008', service: { name: 'Public event permit' }, status: 'EXPIRED', issuedOn: '2025-03-02', validUntil: '2026-03-01' }),
      '/api/v1/verify/NOPE': () => problem(404, 'NOT_FOUND', 'Not found.'),
    });
    renderAt('/verify/SHOP-LIC-2026-00001');
    expect(await screen.findByText('Valid certificate')).toBeTruthy();
    expect(screen.getByText('17 Oct 2027')).toBeTruthy();
    cleanup();
    renderAt('/verify/EVENT-PMT-2025-00008');
    expect(await screen.findByText('Expired certificate')).toBeTruthy();
    expect(screen.getByText('2 Mar 2026')).toBeTruthy(); // expired on the anniversary
    cleanup();
    renderAt('/verify/NOPE');
    expect(await screen.findByText('Certificate not found')).toBeTruthy();
    cleanup();
    renderAt('/verify?no=%20shop-lic-2026-00001'); // HANDOFF link format
    expect(await screen.findByText('Valid certificate')).toBeTruthy();
  });
});

describe('applicant screens', () => {
  it('S-07 lists own requests with the next step per status', async () => {
    stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.faisal),
      '/api/v1/requests/mine': () => json(200, [
        { id: 2, referenceNo: 'KH-2026-000002', status: 'INFO_REQUESTED', service: { code: 'SHOP-LIC', name: 'Shop licence renewal' }, submittedAt: '2026-10-14T07:00:00Z', dueAt: '2026-10-21T20:59:59.999Z', decidedAt: null, certificateNo: null, sla: 'ON_TRACK' },
        { id: 3, referenceNo: null, status: 'DRAFT', service: { code: 'EVENT-PMT', name: 'Public event permit' }, submittedAt: null, dueAt: null, decidedAt: null, certificateNo: null, sla: null },
      ]),
    });
    renderAt('/applicant');
    expect(await screen.findByText('1 request needs your response.')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Continue draft' })[0].getAttribute('href')).toBe('/applicant/requests/3/edit');
    expect(screen.getAllByText('Set on submit').length).toBeGreaterThan(0);
  });

  it('S-05 shows the REQ_INCOMPLETE error summary when submit is refused (BR-01)', async () => {
    const draft = detail({ status: 'DRAFT', referenceNo: null, dueIfSubmittedNow: '2026-10-25T20:59:59.999Z', actions: { ...NO_ACTIONS, edit: true, submit: true } });
    stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.faisal),
      '/api/v1/requests/7': (init) => (init?.method === 'PATCH' ? json(200, draft) : json(200, draft)),
      '/api/v1/requests/7/submit': () => json(422, { code: 'REQ_INCOMPLETE', title: 'Complete all required fields and documents before submitting.', status: 422, fields: ['documents.CR_NUMBER'] }),
    });
    renderAt('/applicant/requests/7/edit');
    expect(await screen.findByText('25 Oct 2026')).toBeTruthy(); // "If submitted now, due"
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Submit request' })[0]);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain("You can't submit yet. 1 item needs attention.");
    expect(alert.textContent).toContain('Enter the commercial registration number.');
  });

  it('S-08 withdraw needs the confirmation dialog and posts confirm: true (BR-10, PQ-17)', async () => {
    const r = detail({ actions: { ...NO_ACTIONS, withdraw: true } });
    const fetchMock = stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.faisal),
      '/api/v1/requests/7': () => json(200, r),
      '/api/v1/requests/7/withdraw': () => json(200, { ...r, status: 'WITHDRAWN', actions: NO_ACTIONS }),
    });
    renderAt('/applicant/requests/7');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Withdraw request' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/This can't be undone/)).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw request' }));
    expect(await screen.findByText('You withdrew this request')).toBeTruthy();
    const call = fetchMock.mock.calls.find(([u]) => u === '/api/v1/requests/7/withdraw')!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({ confirm: true });
  });

  it('S-08 shows the applicant their own national ID and role labels instead of staff names (BR-16, PQ-18)', async () => {
    stubFetch({ '/api/v1/auth/me': () => json(200, USERS.faisal), '/api/v1/requests/7': () => json(200, detail({ applicant: { id: 1, name: 'Faisal Demo', nationalId: '0000000001' }, assignee: { id: null, name: 'Reviewer' } })) });
    renderAt('/applicant/requests/7');
    expect(await screen.findByText('0000000001')).toBeTruthy();
    expect(document.body.textContent).not.toContain('Noura');
  });
});

describe('staff screens', () => {
  const row = (over: object) => ({ id: 1, referenceNo: 'KH-2026-000001', status: 'SUBMITTED', service: { code: 'SHOP-LIC', name: 'Shop licence renewal' }, applicantName: 'Faisal Demo', assignee: null, submittedAt: '2026-10-18T07:00:00Z', dueAt: '2026-10-25T20:59:59.999Z', sla: 'ON_TRACK', workingDaysLeft: 5, infoCycles: 0, actions: { pick: true, assign: false, reassign: false }, ...over });

  it('S-09 queue keeps the API order (BR-13) and Pick assigns the request', async () => {
    const fetchMock = stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.noura),
      '/api/v1/queue': () => json(200, [row({ id: 2, referenceNo: 'KH-2026-000002', sla: 'OVERDUE' }), row({ id: 1 })]),
      '/api/v1/requests/2/pick': () => json(200, detail()),
    });
    renderAt('/staff/review');
    expect(await screen.findByRole('heading', { name: 'Licensing queue' })).toBeTruthy();
    const refs = (await screen.findAllByRole('link', { name: /KH-2026-/ })).map((a) => a.textContent);
    expect(refs.slice(0, 2)).toEqual(['KH-2026-000002', 'KH-2026-000001']);
    expect(screen.getByText('1 overdue')).toBeTruthy();
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Pick' })[0]);
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([u, i]) => u === '/api/v1/requests/2/pick' && i?.method === 'POST')).toBe(true));
  });

  it('S-09 explains LOAD_LIMIT when a pick is refused (BR-06)', async () => {
    stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.noura),
      '/api/v1/queue': () => json(200, [row({})]),
      '/api/v1/requests/1/pick': () => json(409, { code: 'LOAD_LIMIT', title: 'You have reached your active request limit.', status: 409, limit: 10 }),
    });
    renderAt('/staff/review');
    await userEvent.setup().click((await screen.findAllByRole('button', { name: 'Pick' }))[0]);
    expect((await screen.findByRole('alert')).textContent).toContain("You're at your limit of 10 active requests");
  });

  it('D-3 reject needs a reason and at least 30 characters before posting (BR-08)', async () => {
    const fetchMock = stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.noura),
      '/api/v1/requests/7': () => json(200, detail({ applicant: { id: 1, name: 'Faisal Demo', nationalId: '0000000001' }, actions: { ...NO_ACTIONS, requestInfo: true, approve: true, reject: true, comment: true, commentInternal: true } })),
    });
    renderAt('/staff/requests/7');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Justification/), 'Too short');
    await user.click(within(dialog).getByRole('button', { name: 'Reject request' }));
    expect(within(dialog).getByText('Choose a reason.')).toBeTruthy();
    expect(within(dialog).getByText('Write at least 30 characters.')).toBeTruthy();
    expect(fetchMock.mock.calls.some(([u]) => u === '/api/v1/requests/7/reject')).toBe(false);
    expect(screen.getByText('Visible to you as assignee')).toBeTruthy(); // BR-16
  });

  it('S-11 dashboard shows the four PRD numbers', async () => {
    stubFetch({
      '/api/v1/auth/me': () => json(200, USERS.khalid),
      '/api/v1/dashboard': () => json(200, { department: { id: 1, name: 'Licensing' }, open: 7, atRisk: 2, overdue: 1, reviewers: [{ id: 3, name: 'Noura Demo', active: 2, limit: 10 }] }),
    });
    renderAt('/staff/supervisor');
    expect(await screen.findByRole('heading', { name: 'Licensing dashboard' })).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('2 / 10')).toBeTruthy();
    expect(screen.queryByText('Unassigned')).toBeNull(); // F-18: four numbers only
  });
});
