import {createRoot} from 'react-dom/client';
import {GoogleOAuthProvider} from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

const oauthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID?.trim();

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={oauthClientId || 'szs-demo-preview-mode'}>
    <App isDemoModeInitial={!oauthClientId} />
  </GoogleOAuthProvider>,
);
