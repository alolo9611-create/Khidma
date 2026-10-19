import { Router } from 'express';
import { invalid } from '../../core/problem.js';
import type { AuthDeps } from '../accounts/auth.service.js';
import { currentUser, requireRole } from '../accounts/require-role.js';
import { myRequests, requestDetail } from './views.js';
import {
  addComment, approve, assign, createDraft, pick, reject, requestInfo, respond, saveDraft, submit, withdraw,
  type WorkflowDeps,
} from './workflow.js';

// PRD §06: POST /requests · PATCH …/:id · POST …/:id/{submit,pick,assign,request-info,respond,approve,reject,withdraw,comments}
// Status changes only through these transition endpoints — never a free PATCH.
export function requestsRouter(deps: AuthDeps & WorkflowDeps): Router {
  const router = Router();
  const any = requireRole(deps, []);
  const applicant = requireRole(deps, ['APPLICANT']);
  const staff = requireRole(deps, ['REVIEWER', 'SUPERVISOR']);
  const body = (b: unknown) => (b && typeof b === 'object' ? (b as Record<string, unknown>) : {});
  const id = (raw: unknown) => Number(raw);

  router.get('/mine', applicant, (req, res) => { res.json(myRequests(deps, currentUser(req))); });

  router.post('/', applicant, (req, res) => {
    const newId = createDraft(deps, currentUser(req), body(req.body).serviceCode);
    res.status(201).json(requestDetail(deps, currentUser(req), newId));
  });

  router.get('/:id', any, (req, res) => { res.json(requestDetail(deps, currentUser(req), id(req.params.id))); });

  router.patch('/:id', applicant, (req, res) => {
    if (!req.body || typeof req.body !== 'object') throw invalid(['body']);
    saveDraft(deps, currentUser(req), id(req.params.id), body(req.body));
    res.json(requestDetail(deps, currentUser(req), id(req.params.id)));
  });

  const action = (path: string, guard: typeof any, fn: (user: ReturnType<typeof currentUser>, rid: number, b: Record<string, unknown>) => unknown) => {
    router.post(`/:id/${path}`, guard, (req, res) => {
      fn(currentUser(req), id(req.params.id), body(req.body));
      res.json(requestDetail(deps, currentUser(req), id(req.params.id)));
    });
  };
  action('submit', applicant, (u, r) => submit(deps, u, r));
  action('withdraw', applicant, (u, r, b) => withdraw(deps, u, r, b));
  action('respond', applicant, (u, r, b) => respond(deps, u, r, b));
  action('pick', staff, (u, r) => pick(deps, u, r));
  action('assign', staff, (u, r, b) => assign(deps, u, r, b));
  action('request-info', staff, (u, r, b) => requestInfo(deps, u, r, b));
  action('approve', staff, (u, r) => approve(deps, u, r));
  action('reject', staff, (u, r, b) => reject(deps, u, r, b));

  router.post('/:id/comments', any, (req, res) => {
    addComment(deps, currentUser(req), id(req.params.id), body(req.body));
    res.status(201).json(requestDetail(deps, currentUser(req), id(req.params.id)));
  });

  return router;
}
