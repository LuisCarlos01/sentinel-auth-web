import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ApiError } from './apiClient';
import { type AuthFormState, type AuthMode, type FieldErrors, initialFormState } from './types';

export function useAuthCardState() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<AuthFormState>(initialFormState);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setForm(initialFormState);
    setFormError(null);
    setNotice(null);
    setFieldErrors({});
  };

  const updateField = (field: keyof AuthFormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async () => {
    setFormError(null);
    setNotice(null);
    setFieldErrors({});

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setPending(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/', { replace: true });
      } else {
        await register(form.email, form.password);
        setMode('login');
        setForm({ ...initialFormState, email: form.email });
        setNotice('Account created — sign in to continue.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors.length > 0) {
          const next: FieldErrors = {};
          for (const fieldError of err.errors) {
            if (fieldError.field === 'email' || fieldError.field === 'password') {
              next[fieldError.field] = fieldError.message;
            }
          }
          setFieldErrors(next);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Something went wrong. Try again.');
      }
    } finally {
      setPending(false);
    }
  };

  return { mode, toggleMode, form, updateField, submit, pending, formError, notice, fieldErrors };
}

export type AuthCardState = ReturnType<typeof useAuthCardState>;
