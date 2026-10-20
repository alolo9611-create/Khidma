import { Router } from 'express';
import type { AuthDeps } from '../accounts/auth.service.js';
import { currentUser, requireRole } from '../accounts/require-role.js';
import { dashboard, myLoad, queue, reviewersWithLoad } from '../requests/views.js';
import type { WorkflowDeps } from '../requests/workflow.js';

export function reviewRouter(deps: AuthDeps & WorkflowDeps): Router {
  const router = Router();
  const staff = requireRole(deps, ['REVIEWER', 'SUPERVISOR']);
  const supervisor = requireRole(deps, ['SUPERVISOR']);

  // F-11 / F-17: GET /queue?status=open|all|<STATUS>&service=<CODE>
  router.get('/queue', staff, async (req, res) => { res.json(await queue(deps, currentUser(req), req.query)); });
  router.get('/me/load', staff, async (req, res) => { res.json(await myLoad(deps, currentUser(req))); });
  // F-18
  router.get('/dashboard', supervisor, async (req, res) => { res.json(await dashboard(deps, currentUser(req))); });
  // F-12: assign dialog — department reviewers with their active load (BR-06).
  router.get('/accounts/reviewers', supervisor, async (req, res) => { res.json(await reviewersWithLoad(deps, currentUser(req).departmentId!)); });

  return router;
}
