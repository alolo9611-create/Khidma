import { Router } from 'express';
import { problem } from '../../core/problem.js';
import { isoDate, localDate } from '../../core/time.js';
import { certificateStatus, certificateValidUntil, normalizeCertificateNo } from '../../rules/numbers.js';
import type { AuthDeps } from '../accounts/auth.service.js';
import { currentUser, requireRole } from '../accounts/require-role.js';
import type { WorkflowDeps } from '../requests/workflow.js';

export function trustRouter(deps: AuthDeps & WorkflowDeps): Router {
  const router = Router();
  const any = requireRole(deps, []);

  // F-19: bell — unread count and list (small lists, no pagination).
  router.get('/notifications', any, (req, res) => {
    const user = currentUser(req);
    const items = deps.db.prepare('SELECT id, message, link, readAt, createdAt FROM notifications WHERE userId = ? ORDER BY createdAt DESC, id DESC')
      .all(user.id) as { readAt: string | null }[];
    res.json({ unread: items.filter((n) => n.readAt === null).length, items });
  });

  router.post('/notifications/:id/read', any, (req, res) => {
    const user = currentUser(req);
    const n = deps.db.prepare('SELECT id, userId, link, readAt FROM notifications WHERE id = ?').get(Number(req.params.id)) as { id: number; userId: number; link: string; readAt: string | null } | undefined;
    if (!n) throw problem('NOT_FOUND');
    if (n.userId !== user.id) throw problem('FORBIDDEN');
    if (n.readAt === null) deps.db.prepare('UPDATE notifications SET readAt = ? WHERE id = ?').run(deps.clock.now().toISOString(), n.id);
    res.json({ id: n.id, link: n.link });
  });

  // F-22 / BR-17: public, no auth; service, valid/expired and dates only — no personal data.
  router.get('/verify/:certificateNo', (req, res) => {
    const no = normalizeCertificateNo(String(req.params.certificateNo));
    const r = deps.db.prepare(`SELECT r.certificateNo, r.decidedAt, s.name AS serviceName FROM requests r JOIN service_types s ON s.id = r.serviceTypeId
      WHERE r.certificateNo = ? AND r.status = 'APPROVED'`).get(no) as { certificateNo: string; decidedAt: string; serviceName: string } | undefined;
    if (!r) throw problem('NOT_FOUND');
    const validUntil = certificateValidUntil(new Date(r.decidedAt), deps.timezone);
    res.json({
      certificateNo: r.certificateNo, service: { name: r.serviceName },
      status: certificateStatus(validUntil, deps.clock.now(), deps.timezone),
      issuedOn: isoDate(localDate(new Date(r.decidedAt), deps.timezone)), validUntil,
    });
  });

  return router;
}
