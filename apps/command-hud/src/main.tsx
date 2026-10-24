import {createRoot} from 'react-dom/client';
import {GoogleOAuthProvider} from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

const oauthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID?.trim();

createRoot(document.getElementById('root')!).render(
  oauthClientId
    ? <GoogleOAuthProvider clientId={oauthClientId}><App /></GoogleOAuthProvider>
    : (
      <main className="flex h-screen items-center justify-center bg-bg-obsidian px-6 text-center text-text-mana">
        <section className="max-w-lg rounded-xl border border-accent-teal p-8">
          <h1 className="font-display text-xl font-bold">Google sign-in is not configured</h1>
          <p className="mt-3 font-mono text-sm text-text-mana/70">
            Add the public VITE_OAUTH_CLIENT_ID to the local HUD environment to enable sign-in.
          </p>
        </section>
      </main>
    ),
);
