function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 0a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 0Z" />
    </svg>
  );
}

/**
 * Visual apenas — `sentinel-auth-api` não expõe OAuth hoje (só email+senha
 * em /auth/register e /auth/login, ver
 * docs/integrations/sentinel-auth-api-web.md). Espaço reservado no layout
 * para uma futura integração Google/GitHub; sem onClick de verdade.
 */
export function OAuthButtons({ formTone = 'dark' }: { formTone?: 'dark' | 'light' }) {
  const isDark = formTone === 'dark';
  const buttonClass = `flex flex-1 items-center justify-center gap-2 rounded-full border py-2 text-xs font-medium opacity-70 ${
    isDark ? 'border-zinc-700 text-zinc-300' : 'border-zinc-300 text-zinc-600'
  }`;

  return (
    <div className="flex gap-3">
      <button
        type="button"
        disabled
        title="Future integration — not in the current sentinel-auth-api contract"
        className={buttonClass}
      >
        <GoogleIcon />
        Google
      </button>
      <button
        type="button"
        disabled
        title="Future integration — not in the current sentinel-auth-api contract"
        className={buttonClass}
      >
        <GitHubIcon />
        GitHub
      </button>
    </div>
  );
}
