import { useState, type ReactNode } from 'react';
import type { AuthCardState } from '../../auth/useAuthCardState';

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 6h18v12H3z" strokeLinejoin="round" />
      <path d="m3 7 9 6 9-6" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a15.5 15.5 0 0 1-3.4 4.3M6.6 6.6C3.4 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

interface UnderlineFieldProps {
  icon: ReactNode;
  label: string;
  type: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  formTone: 'dark' | 'light';
  error?: string;
}

function UnderlineField({ icon, label, type, name, autoComplete, value, onChange, formTone, error }: UnderlineFieldProps) {
  const isDark = formTone === 'dark';
  const isPassword = type === 'password';
  const [revealed, setRevealed] = useState(false);

  return (
    <label className="group block">
      <span
        className={`mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide transition-colors group-focus-within:text-[var(--accent)] ${
          isDark ? 'text-zinc-400' : 'text-zinc-500'
        }`}
      >
        {icon}
        {label}
      </span>
      <div className="relative">
        <input
          type={isPassword && revealed ? 'text' : type}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border-0 border-b bg-transparent pb-1.5 text-sm outline-none transition-colors focus:border-[var(--accent)] ${
            isPassword ? 'pr-7' : ''
          } ${error ? 'border-red-500' : isDark ? 'border-zinc-700 text-zinc-100 placeholder:text-zinc-600' : 'border-zinc-300 text-zinc-900'}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className={`absolute top-1/2 right-0 -translate-y-1/2 pb-1.5 transition-colors ${
              isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function AuthFields({ state, formTone = 'dark' }: { state: AuthCardState; formTone?: 'dark' | 'light' }) {
  const { mode, form, updateField, fieldErrors } = state;
  return (
    <div className="flex flex-col gap-4">
      <UnderlineField
        icon={<EmailIcon />}
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={form.email}
        onChange={(v) => updateField('email', v)}
        formTone={formTone}
        error={fieldErrors.email}
      />
      <UnderlineField
        icon={<LockIcon />}
        label="Password"
        type="password"
        name="password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        value={form.password}
        onChange={(v) => updateField('password', v)}
        formTone={formTone}
        error={fieldErrors.password}
      />
      {mode === 'register' && (
        <UnderlineField
          icon={<LockIcon />}
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(v) => updateField('confirmPassword', v)}
          formTone={formTone}
          error={fieldErrors.confirmPassword}
        />
      )}
    </div>
  );
}
