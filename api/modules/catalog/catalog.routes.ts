import { Router } from 'express';
import { invalid, problem } from '../../core/problem.js';
import type { AuthDeps } from '../accounts/auth.service.js';
import { currentUser, requireRole } from '../accounts/require-role.js';
import { findServiceByCode, findServiceById, listServices, toServiceView, updateServiceSettings } from './catalog.repository.js';

export function catalogRouter(deps: AuthDeps): Router {
  const router = Router();
  const { db } = deps;

  // F-03: public list of active services (no sign-in).
  router.get('/', (_req, res) => {
    res.json(listServices(db, { activeOnly: true }).map((s) => toServiceView(db, s)));
  });

  // F-04: the supervisor's own department, including inactive services.
  router.get('/mine', requireRole(deps, ['SUPERVISOR']), (req, res) => {
    const user = currentUser(req);
    res.json(listServices(db, { departmentId: user.departmentId! }).map((s) => toServiceView(db, s)));
  });

  // F-03 + PQ-07: inactive or unknown services are 404 on the public detail.
  router.get('/:code', (req, res) => {
    const s = findServiceByCode(db, String(req.params.code));
    if (!s || s.isActive !== 1) throw problem('NOT_FOUND');
    res.json(toServiceView(db, s));
  });

  // F-04 / BR-11: supervisor edits slaDays (1–30) and the active flag of own department's services.
  router.patch('/:id', requireRole(deps, ['SUPERVISOR']), (req, res) => {
    const user = currentUser(req);
    const id = Number(req.params.id);
    const s = Number.isInteger(id) ? findServiceById(db, id) : undefined;
    if (!s) throw problem('NOT_FOUND');
    if (s.departmentId !== user.departmentId) throw problem('FORBIDDEN'); // BR-18
    const body = req.body ?? {};
    const bad: string[] = [];
    for (const k of Object.keys(body)) if (k !== 'slaDays' && k !== 'isActive') bad.push(k);
    if (body.slaDays !== undefined && (!Number.isInteger(body.slaDays) || body.slaDays < 1 || body.slaDays > 30)) bad.push('slaDays');
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') bad.push('isActive');
    if (body.slaDays === undefined && body.isActive === undefined && bad.length === 0) bad.push('body');
    if (bad.length) throw invalid(bad);
    // PQ-07: existing requests keep the dueAt set at submit; nothing is recomputed.
    updateServiceSettings(db, id, { slaDays: body.slaDays, isActive: body.isActive });
    res.json(toServiceView(db, findServiceById(db, id)!));
  });

  return router;
}
