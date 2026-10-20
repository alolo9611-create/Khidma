import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { COMPLETE_SHOP_LIC, testApp } from '../../test/helpers.js';

type T = Awaited<ReturnType<typeof testApp>>;

async function draft(t: T, who: 'faisal' | 'huda' = 'faisal', code = 'SHOP-LIC') {
  const res = await t.as(who).post('/api/v1/requests', { serviceCode: code });
  expect(res.status).toBe(201);
  return res.body.id as number;
}
async function submitted(t: T, who: 'faisal' | 'huda' = 'faisal') {
  const id = await draft(t, who);
  await t.as(who).patch(`/api/v1/requests/${id}`, COMPLETE_SHOP_LIC).expect(200);
  const res = await t.as(who).post(`/api/v1/requests/${id}/submit`);
  expect(res.status).toBe(200);
  return id;
}
async function inReview(t: T, who: 'faisal' | 'huda' = 'faisal') {
  const id = await submitted(t, who);
  await t.as('noura').post(`/api/v1/requests/${id}/pick`).expect(200);
  return id;
}

describe('catalog (F-03, F-04)', () => {
  it('lists active services publicly with SLA and required documents', async () => {
    const t = await testApp();
    const res = await request(t.app).get('/api/v1/services').expect(200);
    expect(res.body.map((s: { code: string }) => s.code)).toEqual(['EVENT-PMT', 'SHOP-LIC', 'SIGN-PMT']);
    const shop = res.body.find((s: { code: string }) => s.code === 'SHOP-LIC');
    expect(shop.slaDays).toBe(5);
    expect(shop.documents.map((d: { typeCode: string }) => d.typeCode)).toEqual(['LEASE_CONTRACT', 'CR_NUMBER']);
  });
  it('supervisor edits own department slaDays (1–30) and active flag; inactive services leave the public catalog (PQ-07)', async () => {
    const t = await testApp();
    await t.as('khalid').patch('/api/v1/services/1', { slaDays: 31 }).expect(400);
    await t.as('khalid').patch('/api/v1/services/3', { slaDays: 4 }).expect(403); // Events, not Licensing (BR-18)
    await t.as('noura').patch('/api/v1/services/1', { slaDays: 4 }).expect(403);
    const ok = await t.as('khalid').patch('/api/v1/services/1', { slaDays: 4, isActive: false }).expect(200);
    expect(ok.body).toMatchObject({ slaDays: 4, isActive: false });
    await request(t.app).get('/api/v1/services/SHOP-LIC').expect(404);
    const create = await t.as('faisal').post('/api/v1/requests', { serviceCode: 'SHOP-LIC' });
    expect(create.status).toBe(409);
    expect(create.body.code).toBe('SERVICE_INACTIVE');
  });
});

describe('draft & submit (F-05 … F-08, T-01)', () => {
  it('happy path: reference number, due date, activity and notification', async () => {
    const t = await testApp();
    const id = await submitted(t);
    const res = await t.as('faisal').get(`/api/v1/requests/${id}`).expect(200);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.referenceNo).toBe('KH-2026-000001'); // BR-02
    expect(res.body.dueAt).toBe('2026-10-25T20:59:59.999Z'); // BR-11
    expect(res.body.timeline.map((e: { action: string }) => e.action)).toEqual(['SUBMIT']); // BR-15
    const n = await t.as('faisal').get('/api/v1/notifications').expect(200);
    expect(n.body.unread).toBe(1); // BR-14
    expect(n.body.items[0].message).toBe('Your request KH-2026-000001 was submitted.');
  });
  it('BR-01: submit is blocked with REQ_INCOMPLETE listing the missing items', async () => {
    const t = await testApp();
    const id = await draft(t);
    expect((await t.as('faisal').get(`/api/v1/requests/${id}`)).body.dueIfSubmittedNow).toBe('2026-10-25T20:59:59.999Z');
    await t.as('faisal').patch(`/api/v1/requests/${id}`, { formData: COMPLETE_SHOP_LIC.formData }).expect(200);
    const res = await t.as('faisal').post(`/api/v1/requests/${id}/submit`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('REQ_INCOMPLETE');
    expect(res.body.fields).toEqual(['documents.LEASE_CONTRACT', 'documents.CR_NUMBER']);
  });
  it('rejects invalid document numbers and unknown fields on save', async () => {
    const t = await testApp();
    const id = await draft(t);
    const res = await t.as('faisal').patch(`/api/v1/requests/${id}`, { documents: { LEASE_CONTRACT: 'bad number!' }, status: 'APPROVED' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.title).toBe('Some fields are invalid.');
    expect(res.body.fields).toEqual(['status', 'documents.LEASE_CONTRACT']);
  });
  it('BR-02: the sequence increments and restarts each year', async () => {
    const t = await testApp(new Date('2026-12-31T19:00:00Z')); // 22:00 Riyadh, 31 Dec
    const a = await submitted(t, 'faisal');
    t.clock.advance(3 * 60 * 60 * 1000); // 01:00 Riyadh, 1 Jan 2027
    const b = await submitted(t, 'huda');
    expect((await t.as('faisal').get(`/api/v1/requests/${a}`)).body.referenceNo).toBe('KH-2026-000001');
    expect((await t.as('huda').get(`/api/v1/requests/${b}`)).body.referenceNo).toBe('KH-2027-000001');
  });
  it('BR-03: a second open request for the same service is refused; allowMultiple services are exempt', async () => {
    const t = await testApp();
    await submitted(t);
    const second = await draft(t);
    await t.as('faisal').patch(`/api/v1/requests/${second}`, COMPLETE_SHOP_LIC).expect(200);
    const res = await t.as('faisal').post(`/api/v1/requests/${second}/submit`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('REQ_DUPLICATE_OPEN');
    expect(res.body.openReferenceNo).toBe('KH-2026-000001');
  });
  it('BR-03: a decided or withdrawn request does not block a new one (tracker #44 AC)', async () => {
    const t = await testApp();
    const first = await submitted(t);
    await t.as('faisal').post(`/api/v1/requests/${first}/withdraw`, { confirm: true }).expect(200);
    await submitted(t); // succeeds: the earlier request is terminal
  });
  it('BR-04: a submitted request is read-only to the applicant', async () => {
    const t = await testApp();
    const id = await submitted(t);
    const res = await t.as('faisal').patch(`/api/v1/requests/${id}`, { formData: { shopName: 'Changed name' } });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

describe('my requests & access (F-09, BR-18)', () => {
  it('lists only own requests, drafts included (PQ-18)', async () => {
    const t = await testApp();
    await draft(t, 'faisal');
    await draft(t, 'huda');
    const res = await t.as('faisal').get('/api/v1/requests/mine').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('DRAFT');
  });
  it('another applicant or another department gets 403; unknown id 404; no session 401', async () => {
    const t = await testApp();
    const id = await submitted(t);
    expect((await t.as('huda').get(`/api/v1/requests/${id}`)).status).toBe(403);
    expect((await t.as('layla').get(`/api/v1/requests/${id}`)).status).toBe(403);
    expect((await t.as('faisal').get('/api/v1/requests/999')).status).toBe(404);
    expect((await request(t.app).get(`/api/v1/requests/${id}`)).status).toBe(401);
  });
  it('BR-16: the national ID is masked for the supervisor, raw for the applicant and the assigned reviewer', async () => {
    const t = await testApp();
    const id = await inReview(t);
    expect((await t.as('faisal').get(`/api/v1/requests/${id}`)).body.applicant.nationalId).toBe('0000000001');
    expect((await t.as('noura').get(`/api/v1/requests/${id}`)).body.applicant.nationalId).toBe('0000000001');
    expect((await t.as('khalid').get(`/api/v1/requests/${id}`)).body.applicant.nationalId).toBe('******0001');
    expect((await t.as('omar').get(`/api/v1/requests/${id}`)).body.applicant.nationalId).toBe('******0001');
    expect(JSON.stringify((await t.as('faisal').get('/api/v1/requests/mine')).body)).not.toContain('nationalId');
  });
});

describe('withdraw (F-10, BR-10, T-07)', () => {
  it('needs explicit confirmation (PQ-17) and frees the reviewer slot', async () => {
    const t = await testApp();
    const id = await inReview(t);
    expect((await t.as('faisal').post(`/api/v1/requests/${id}/withdraw`)).status).toBe(400);
    const res = await t.as('faisal').post(`/api/v1/requests/${id}/withdraw`, { confirm: true }).expect(200);
    expect(res.body.status).toBe('WITHDRAWN');
    const reviewers = await t.as('khalid').get('/api/v1/accounts/reviewers').expect(200);
    expect(reviewers.body.find((r: { id: number }) => r.id === 3).active).toBe(0);
    const again = await t.as('faisal').post(`/api/v1/requests/${id}/withdraw`, { confirm: true });
    expect(again.body.code).toBe('INVALID_TRANSITION');
  });
});

describe('queue, pick & assign (F-11, F-12, F-17, BR-05, BR-06)', () => {
  it('department queue shows open requests only, with SLA status; other departments see nothing', async () => {
    const t = await testApp();
    const id = await submitted(t);
    await draft(t, 'huda');
    const q = await t.as('noura').get('/api/v1/queue').expect(200);
    expect(q.body.map((r: { id: number }) => r.id)).toEqual([id]);
    expect(q.body[0].sla).toBe('ON_TRACK');
    expect(q.body[0].workingDaysLeft).toBe(5);
    expect((await t.as('noura').get('/api/v1/me/load')).body).toEqual({ active: 0, limit: 10 });
    expect((await t.as('layla').get('/api/v1/queue')).body).toEqual([]);
    expect((await t.as('faisal').get('/api/v1/queue')).status).toBe(403);
  });
  it('filters by status and service (tracker #51 AC)', async () => {
    const t = await testApp();
    const shop = await submitted(t, 'faisal');
    const sign = await draft(t, 'huda', 'SIGN-PMT');
    await t.as('huda').patch(`/api/v1/requests/${sign}`, { formData: { shopName: 'Sample Bakery', signText: 'Bakery', signWidthCm: 120, signHeightCm: 40 }, documents: { CR_NUMBER: 'CR-1', SHOP_LICENCE_NO: 'SL-1' } }).expect(200);
    await t.as('huda').post(`/api/v1/requests/${sign}/submit`).expect(200);
    expect((await t.as('noura').get('/api/v1/queue?service=SIGN-PMT')).body.map((r: { id: number }) => r.id)).toEqual([sign]);
    await t.as('faisal').post(`/api/v1/requests/${shop}/withdraw`, { confirm: true }).expect(200);
    expect((await t.as('noura').get('/api/v1/queue')).body.map((r: { id: number }) => r.id)).toEqual([sign]);
    expect((await t.as('noura').get('/api/v1/queue?status=WITHDRAWN')).body.map((r: { id: number }) => r.id)).toEqual([shop]);
    expect((await t.as('noura').get('/api/v1/queue?status=DRAFT')).status).toBe(400); // drafts never reach staff
  });
  it('BR-06: a reviewer cannot pick above the load limit; a supervisor can still assign', async () => {
    const t = await testApp();
    await t.db.run('UPDATE departments SET maxActivePerReviewer = 1 WHERE id = 1');
    await inReview(t, 'faisal');
    const second = await submitted(t, 'huda');
    const res = await t.as('noura').post(`/api/v1/requests/${second}/pick`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LOAD_LIMIT');
    await t.as('khalid').post(`/api/v1/requests/${second}/assign`, { reviewerId: 3 }).expect(200);
    const n = await t.as('noura').get('/api/v1/notifications');
    expect(n.body.items[0].message).toBe('Request KH-2026-000002 was assigned to you.'); // BR-14
  });
  it('supervisors cannot pick (self-assign) and can only assign department reviewers (PQ-14 b)', async () => {
    const t = await testApp();
    const id = await submitted(t);
    expect((await t.as('khalid').post(`/api/v1/requests/${id}/pick`)).status).toBe(403);
    expect((await t.as('khalid').post(`/api/v1/requests/${id}/assign`, { reviewerId: 6 })).status).toBe(400);
    expect((await t.as('khalid').post(`/api/v1/requests/${id}/assign`, { reviewerId: 5 })).status).toBe(400);
  });
  it('reassign keeps the status and writes a REASSIGN entry hidden from the applicant (PQ-14 c, PQ-18)', async () => {
    const t = await testApp();
    const id = await inReview(t);
    const res = await t.as('khalid').post(`/api/v1/requests/${id}/assign`, { reviewerId: 4 }).expect(200);
    expect(res.body.status).toBe('IN_REVIEW');
    expect(res.body.assignee.id).toBe(4);
    const staffView = (await t.as('khalid').get(`/api/v1/requests/${id}`)).body.timeline.map((e: { action: string }) => e.action);
    expect(staffView).toEqual(['SUBMIT', 'PICK', 'REASSIGN']);
    const applicantView = (await t.as('faisal').get(`/api/v1/requests/${id}`)).body.timeline.map((e: { action: string }) => e.action);
    expect(applicantView).toEqual(['SUBMIT', 'PICK']);
  });
});

describe('request info & respond (F-13, BR-04, BR-07)', () => {
  const MSG = 'Please correct the lease contract number.';
  it('message ≥ 20 characters; max two cycles; applicant edits and responds to the same assignee', async () => {
    const t = await testApp();
    const id = await inReview(t);
    expect((await t.as('noura').post(`/api/v1/requests/${id}/request-info`, { message: 'too short' })).status).toBe(400);
    expect((await t.as('omar').post(`/api/v1/requests/${id}/request-info`, { message: MSG })).status).toBe(403); // not the assignee
    for (let cycle = 1; cycle <= 2; cycle++) {
      const r = await t.as('noura').post(`/api/v1/requests/${id}/request-info`, { message: MSG }).expect(200);
      expect(r.body.status).toBe('INFO_REQUESTED');
      const detail = (await t.as('faisal').get(`/api/v1/requests/${id}`)).body;
      expect(detail.infoMessage).toBe(MSG);
      await t.as('faisal').patch(`/api/v1/requests/${id}`, { documents: { LEASE_CONTRACT: `LC-FIX-${cycle}` } }).expect(200); // BR-04
      const back = await t.as('faisal').post(`/api/v1/requests/${id}/respond`, { message: 'Fixed.' }).expect(200);
      expect(back.body.status).toBe('IN_REVIEW');
      expect(back.body.assignee).toEqual({ id: null, name: 'Reviewer' });
    }
    const third = await t.as('noura').post(`/api/v1/requests/${id}/request-info`, { message: MSG });
    expect(third.status).toBe(409);
    expect(third.body.code).toBe('INFO_LIMIT');
  });
  it('the department supervisor may request info on a request assigned to someone else (PQ-14 a)', async () => {
    const t = await testApp();
    const id = await inReview(t);
    await t.as('khalid').post(`/api/v1/requests/${id}/request-info`, { message: MSG }).expect(200);
  });
});

describe('approve & reject (F-14, BR-08, BR-09)', () => {
  it('approve issues a certificate number; verify shows only service, status and dates (BR-17)', async () => {
    const t = await testApp();
    const id = await inReview(t);
    const res = await t.as('noura').post(`/api/v1/requests/${id}/approve`).expect(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.certificate).toMatchObject({ certificateNo: 'SHOP-LIC-2026-00001', issuedOn: '2026-10-18', validUntil: '2027-10-17', status: 'VALID' });
    const v = await request(t.app).get('/api/v1/verify/%20shop-lic-2026-00001%20').expect(200);
    expect(v.body).toEqual({ certificateNo: 'SHOP-LIC-2026-00001', service: { name: 'Shop licence renewal' }, status: 'VALID', issuedOn: '2026-10-18', validUntil: '2027-10-17' });
    expect(JSON.stringify(v.body)).not.toMatch(/Faisal|nationalId|applicant/i);
    await request(t.app).get('/api/v1/verify/SHOP-LIC-2026-99999').expect(404);
    t.clock.advance(366 * 24 * 60 * 60 * 1000);
    expect((await request(t.app).get('/api/v1/verify/SHOP-LIC-2026-00001')).body.status).toBe('EXPIRED');
  });
  it('reject needs a reason code and a justification of ≥ 30 characters, shown to the applicant', async () => {
    const t = await testApp();
    const id = await inReview(t);
    const bad = await t.as('noura').post(`/api/v1/requests/${id}/reject`, { reasonCode: 'NOPE', justification: 'short' });
    expect(bad.status).toBe(400);
    expect(bad.body.fields).toEqual(['reasonCode', 'justification']);
    const justification = 'The lease contract has expired and cannot be accepted.';
    await t.as('noura').post(`/api/v1/requests/${id}/reject`, { reasonCode: 'DOC_INVALID', justification }).expect(200);
    const applicant = (await t.as('faisal').get(`/api/v1/requests/${id}`)).body;
    expect(applicant).toMatchObject({ status: 'REJECTED', rejectReason: 'DOC_INVALID', rejectJustification: justification });
  });
  it('decisions on a non-IN_REVIEW request are 409 INVALID_TRANSITION', async () => {
    const t = await testApp();
    const id = await submitted(t);
    const res = await t.as('khalid').post(`/api/v1/requests/${id}/approve`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

describe('comments (F-15, BR-18)', () => {
  it('internal notes never reach the applicant', async () => {
    const t = await testApp();
    const id = await inReview(t);
    await t.as('noura').post(`/api/v1/requests/${id}/comments`, { visibility: 'INTERNAL', body: 'Check the CR registry.' }).expect(201);
    await t.as('noura').post(`/api/v1/requests/${id}/comments`, { visibility: 'PUBLIC', body: 'We are reviewing your request.' }).expect(201);
    await t.as('faisal').post(`/api/v1/requests/${id}/comments`, { visibility: 'PUBLIC', body: 'Thank you.' }).expect(201);
    expect((await t.as('faisal').post(`/api/v1/requests/${id}/comments`, { visibility: 'INTERNAL', body: 'x' })).status).toBe(403);
    const mine = (await t.as('faisal').get(`/api/v1/requests/${id}`)).body.comments;
    expect(mine.map((c: { body: string }) => c.body)).toEqual(['We are reviewing your request.', 'Thank you.']);
    expect(mine[0].authorName).toBe('Reviewer');
    const staff = (await t.as('khalid').get(`/api/v1/requests/${id}`)).body.comments;
    expect(staff).toHaveLength(3);
  });
});

describe('dashboard (F-18, BR-12)', () => {
  it('shows open, at risk, overdue and active per reviewer for the own department only', async () => {
    const t = await testApp();
    await inReview(t, 'faisal');
    await submitted(t, 'huda');
    t.clock.advance(7 * 24 * 60 * 60 * 1000); // Sunday 25 Oct 10:00 — the due day
    expect((await t.as('khalid').get('/api/v1/dashboard')).body).toMatchObject({ open: 2, atRisk: 2, overdue: 0 });
    t.clock.advance(24 * 60 * 60 * 1000); // Monday — past due
    const d = await t.as('khalid').get('/api/v1/dashboard').expect(200);
    expect(d.body).toMatchObject({ department: { name: 'Licensing' }, open: 2, atRisk: 0, overdue: 2 });
    expect(d.body.reviewers.find((r: { name: string }) => r.name === 'Noura Demo').active).toBe(1);
    expect((await t.as('noura').get('/api/v1/dashboard')).status).toBe(403);
  });
});

describe('notifications (F-19, BR-14)', () => {
  it('every status change notifies the applicant; read marks it and only the owner can read it', async () => {
    const t = await testApp();
    const id = await inReview(t);
    await t.as('noura').post(`/api/v1/requests/${id}/approve`).expect(200);
    const n = (await t.as('faisal').get('/api/v1/notifications')).body;
    expect(n.items.map((x: { message: string }) => x.message)).toEqual([
      'Your request KH-2026-000001 was approved. Certificate SHOP-LIC-2026-00001.',
      'Your request KH-2026-000001 is now in review.',
      'Your request KH-2026-000001 was submitted.',
    ]);
    expect(n.items[0].link).toBe(`/applicant/requests/${id}`);
    expect((await t.as('huda').post(`/api/v1/notifications/${n.items[0].id}/read`)).status).toBe(403);
    await t.as('faisal').post(`/api/v1/notifications/${n.items[0].id}/read`).expect(200);
    expect((await t.as('faisal').get('/api/v1/notifications')).body.unread).toBe(2);
    expect((await t.as('noura').get('/api/v1/notifications')).body.unread).toBe(0); // self-pick: no notification (PQ-22 b)
  });
});

describe('activity log (F-20, BR-15)', () => {
  it('every transition writes one entry, and entries cannot be updated or deleted', async () => {
    const t = await testApp();
    const id = await inReview(t);
    await t.as('noura').post(`/api/v1/requests/${id}/reject`, { reasonCode: 'OTHER', justification: 'Not eligible under the current policy rules.' }).expect(200);
    const rows = await t.db.all('SELECT action, fromStatus, toStatus, actorId FROM activity_log WHERE requestId = ? ORDER BY id', id);
    expect(rows).toEqual([
      { action: 'SUBMIT', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', actorId: 1 },
      { action: 'PICK', fromStatus: 'SUBMITTED', toStatus: 'IN_REVIEW', actorId: 3 },
      { action: 'REJECT', fromStatus: 'IN_REVIEW', toStatus: 'REJECTED', actorId: 3 },
    ]);
    await expect(t.db.run("UPDATE activity_log SET note = 'x'")).rejects.toThrow(/append-only/);
    await expect(t.db.run('DELETE FROM activity_log')).rejects.toThrow(/append-only/);
  });
});

describe('hardening (security review)', () => {
  it('drafts are private to the applicant: staff get 403 (BR-18, PQ-20)', async () => {
    const t = await testApp();
    const id = await draft(t);
    expect((await t.as('noura').get(`/api/v1/requests/${id}`)).status).toBe(403);
    expect((await t.as('khalid').post(`/api/v1/requests/${id}/comments`, { visibility: 'INTERNAL', body: 'x' })).status).toBe(403);
    expect((await t.as('khalid').post(`/api/v1/requests/${id}/assign`, { reviewerId: 3 })).status).toBe(403);
  });
  it('errors are problem+json, never HTML or stack traces', async () => {
    const t = await testApp();
    const unknown = await request(t.app).get('/api/v1/nope');
    expect(unknown.status).toBe(404);
    expect(unknown.headers['content-type']).toMatch(/problem\+json/);
    const big = await request(t.app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send(`{"email":"${'a'.repeat(200_000)}"}`);
    expect(big.status).toBe(413);
    expect(big.headers['content-type']).toMatch(/problem\+json/);
    expect(big.text).not.toMatch(/node_modules|at /);
    expect(unknown.headers['x-powered-by']).toBeUndefined();
    const badFilter = await t.as('noura').get('/api/v1/queue?status=BOGUS');
    expect(badFilter.status).toBe(400);
    expect(badFilter.body.fields).toEqual(['status']);
  });
});
