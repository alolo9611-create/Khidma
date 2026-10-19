import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiProblem } from '../api/http';
import { khidma } from '../api/khidma';
import { Empty, NotFound, Skeleton } from '../ui/States';

// "Start request" → creates a DRAFT for the service (F-05) and opens the form.
export function NewRequestPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    khidma.createDraft(code).then((r) => navigate(`/applicant/requests/${r.id}/edit`, { replace: true }))
      .catch((e) => setProblem(e instanceof ApiProblem ? e : new ApiProblem(0, 'UNKNOWN', 'Something went wrong.')));
  }, [code, navigate]);
  if (!problem) return <main className="k-main"><Skeleton /></main>;
  if (problem.status === 404) return <NotFound />;
  return (
    <main className="k-main is-tight" style={{ paddingTop: 64 }}>
      <Empty heading icon="alertTriangle" title={problem.code === 'SERVICE_INACTIVE' ? 'This service is not currently available' : 'Something went wrong'}
        text={problem.code === 'SERVICE_INACTIVE' ? 'New requests are closed for this service right now.' : 'Your draft was not created. Try again in a moment.'}
        action={<Link className="k-btn k-btn-secondary k-btn-sm" to="/catalog">Back to services</Link>} />
    </main>
  );
}
