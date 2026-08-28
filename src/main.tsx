import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';
import './globals.css';
import 'flag-icons/css/flag-icons.min.css';
import './source-theme.css';
import './features/whistleblowing/hooks/shepherd-custom.css';
import './i18n';
import { restoreStoredInternalSession } from './store/authStore';

// Restore the in-memory organization/auth context before protected routes and
// their queries mount after a hard refresh.
restoreStoredInternalSession();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
