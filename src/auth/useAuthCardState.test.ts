import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useAuthCardState } from './useAuthCardState';

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), register: vi.fn() }),
}));

function renderState() {
  return renderHook(() => useAuthCardState(), { wrapper: MemoryRouter });
}

describe('useAuthCardState', () => {
  it('clears the form when toggling mode without submitting', () => {
    const { result } = renderState();

    act(() => result.current.updateField('email', 'user@example.com'));
    act(() => result.current.updateField('password', 'secret123'));
    act(() => result.current.toggleMode());

    expect(result.current.form).toEqual({ email: '', password: '', confirmPassword: '' });
  });
});
