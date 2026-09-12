import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthPage } from './AuthPage';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ status: 'unauthenticated' }),
}));

vi.mock('../auth/useAuthCardState', () => ({
  useAuthCardState: () => ({
    // 'register' pra exercitar confirmPassword também — é o campo extra
    // que o relato original de duplicação citava explicitamente
    mode: 'register',
    toggleMode: vi.fn(),
    form: { email: '', password: '', confirmPassword: '' },
    updateField: vi.fn(),
    submit: vi.fn(),
    pending: false,
    formError: null,
    notice: null,
    fieldErrors: {},
  }),
}));

function mockViewport(isDesktop: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('AuthPage', () => {
  it('mounts only the mobile card on a narrow viewport', () => {
    mockViewport(false);
    render(
      <ThemeProvider>
        <AuthPage />
      </ThemeProvider>,
    );
    expect(screen.getAllByLabelText(/email/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^password$/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/confirm password/i)).toHaveLength(1);
  });

  it('mounts only the desktop card on a wide viewport', () => {
    mockViewport(true);
    render(
      <ThemeProvider>
        <AuthPage />
      </ThemeProvider>,
    );
    expect(screen.getAllByLabelText(/email/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^password$/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/confirm password/i)).toHaveLength(1);
  });
});
