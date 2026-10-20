import { Router } from 'express';
import { invalid, problem } from '../../core/problem.js';
import type { AuthDeps } from '../accounts/auth.service.js';
import { currentUser, requireRole } from '../accounts/require-role.js';
import {
  findServiceByCode, findServiceById, listServices, toServiceView, updateServiceSettings, type ServiceRow,
} from './catalog.repository.js';

export function catalogRouter(deps: AuthDeps): Router {
  const router = Router();
  const { db } = deps;
  const views = async (services: ServiceRow[]) => { const out = []; for (const s of services) out.push(await toServiceView(db, s)); return out; };

  // F-03: public list of active services (no sign-in).
  router.get('/', async (_req, res) => {
    res.json(await views(await listServices(db, { activeOnly: true })));
  });

  // F-04: the supervisor's own department, including inactive services.
  router.get('/mine', requireRole(deps, ['SUPERVISOR']), async (req, res) => {
    const user = currentUser(req);
    res.json(await views(await listServices(db, { departmentId: user.departmentId! })));
  });

  // F-03 + PQ-07: inactive or unknown services are 404 on the public detail.
  router.get('/:code', async (req, res) => {
    const s = await findServiceByCode(db, String(req.params.code));
    if (!s || s.isActive !== 1) throw problem('NOT_FOUND');
    res.json(await toServiceView(db, s));
  });

  // F-04 / BR-11: supervisor edits slaDays (1–30) and the active flag of own department's services.
  router.patch('/:id', requireRole(deps, ['SUPERVISOR']), async (req, res) => {
    const user = currentUser(req);
    const id = Number(req.params.id);
    const s = Number.isInteger(id) ? await findServiceById(db, id) : undefined;
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
    await updateServiceSettings(db, id, { slaDays: body.slaDays, isActive: body.isActive });
    res.json(await toServiceView(db, (await findServiceById(db, id))!));
  });

  return router;
}
