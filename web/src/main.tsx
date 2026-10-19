import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { SessionProvider } from './session/SessionContext';
import './styles/khidma-ui.css';
import './styles/app.css';
import { ToastProvider } from './ui/Toast';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <SessionProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </SessionProvider>
  </BrowserRouter>,
);
