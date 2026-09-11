export type AuthMode = 'login' | 'register';

export interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export const initialFormState: AuthFormState = {
  email: '',
  password: '',
  confirmPassword: '',
};

export interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}
