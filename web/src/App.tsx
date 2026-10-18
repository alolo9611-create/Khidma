import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderArea } from './pages/PlaceholderArea';

// Placeholder landing areas (D-2). No role guards yet: F-02 adds them.
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/applicant" element={<PlaceholderArea heading="Applicant area" />} />
      <Route path="/staff/review" element={<PlaceholderArea heading="Staff review area" />} />
      <Route path="/staff/supervisor" element={<PlaceholderArea heading="Staff supervisor area" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
