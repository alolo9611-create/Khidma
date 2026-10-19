import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { App } from '../App';
import { SessionProvider } from '../session/SessionContext';
import { ToastProvider } from '../ui/Toast';

function LocationProbe() {
  const l = useLocation();
  return <span data-testid="path">{l.pathname}</span>;
}

export function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>
          <App />
          <LocationProbe />
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}
