import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { ApplicantRequestPage } from './pages/ApplicantRequestPage';
import { CatalogPage } from './pages/CatalogPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { NewRequestPage } from './pages/NewRequestPage';
import { QueuePage } from './pages/QueuePage';
import { RequestFormPage } from './pages/RequestFormPage';
import { ReviewPage } from './pages/ReviewPage';
import { ServicePage } from './pages/ServicePage';
import { ServicesSettingsPage } from './pages/ServicesSettingsPage';
import { SubmittedPage } from './pages/SubmittedPage';
import { VerifyPage } from './pages/VerifyPage';
import { RequireRole } from './session/RequireRole';
import { useSession } from './session/SessionContext';
import { NotFound } from './ui/States';

// Role landings stay as approved in Story 28 (D-2): /applicant, /staff/review, /staff/supervisor.
// Role guards per F-02 / PQ-08.
const applicant = (el: ReactElement) => <RequireRole roles={['APPLICANT']}>{el}</RequireRole>;
const staff = (el: ReactElement) => <RequireRole roles={['REVIEWER', 'SUPERVISOR']}>{el}</RequireRole>;
const supervisor = (el: ReactElement) => <RequireRole roles={['SUPERVISOR']}>{el}</RequireRole>;

function Fallback() {
  const { user } = useSession();
  return user ? <NotFound /> : <Navigate to="/login" />; // Story 28: unknown routes send signed-out users to /login
}

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/catalog" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:code" element={<ServicePage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:certificateNo" element={<VerifyPage />} />

        <Route path="/applicant" element={applicant(<MyRequestsPage />)} />
        <Route path="/applicant/requests/new/:code" element={applicant(<NewRequestPage />)} />
        <Route path="/applicant/requests/:id/edit" element={applicant(<RequestFormPage />)} />
        <Route path="/applicant/requests/:id/submitted" element={applicant(<SubmittedPage />)} />
        <Route path="/applicant/requests/:id" element={applicant(<ApplicantRequestPage />)} />

        <Route path="/staff/review" element={staff(<QueuePage />)} />
        <Route path="/staff/requests/:id" element={staff(<ReviewPage />)} />
        <Route path="/staff/supervisor" element={supervisor(<DashboardPage />)} />
        <Route path="/staff/supervisor/services" element={supervisor(<ServicesSettingsPage />)} />

        <Route path="*" element={<Fallback />} />
      </Routes>
    </AppShell>
  );
}
