import React from 'react';
import { useGoogleLogin, type TokenResponse } from '@react-oauth/google';
import { MASTER_CONTROL_OAUTH_SCOPES } from '../data/api';

interface GoogleSignInProps {
  deploymentConfigured: boolean;
  error: string | null;
  onError: (message: string) => void;
  onToken: (token: TokenResponse) => void;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  deploymentConfigured,
  error,
  onError,
  onToken,
}) => {
  const signIn = useGoogleLogin({
    flow: 'implicit',
    scope: MASTER_CONTROL_OAUTH_SCOPES.join(' '),
    onSuccess: onToken,
    onError: (response) => onError(response.error_description || response.error || 'Google sign-in was not completed.'),
  });

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={() => signIn()}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-accent-teal bg-accent-teal/15 px-5 py-3 font-display text-sm font-bold text-text-mana transition hover:bg-accent-teal/30"
      >
        <i className="fa-brands fa-google text-alert-orange" aria-hidden="true" />
        Sign in with Google
      </button>
      {!deploymentConfigured && (
        <p className="mt-3 text-center font-mono text-xs text-alert-orange" role="status">
          Google sign-in can be tested now; configure VITE_APPS_SCRIPT_DEPLOYMENT_ID to load HUD data.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
      <p className="mt-4 text-center font-mono text-[0.65rem] text-text-mana/50">
        Your Google access token stays in memory and is cleared when you sign out or it expires.
      </p>
    </div>
  );
};
