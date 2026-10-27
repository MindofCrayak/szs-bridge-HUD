import {createRoot} from 'react-dom/client';
import {GoogleOAuthProvider} from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// Step 6: Dev Hygiene - Ensure no service worker stays registered in development mode
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[Dev Hygiene] Stale ServiceWorker successfully unregistered:', registration.scope);
        }
      });
    }
  }).catch((err) => {
    console.warn('[Dev Hygiene] ServiceWorker unregister error:', err);
  });
}

const oauthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID?.trim();

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={oauthClientId || 'szs-demo-preview-mode'}>
    <App isDemoModeInitial={!oauthClientId} />
  </GoogleOAuthProvider>,
);
