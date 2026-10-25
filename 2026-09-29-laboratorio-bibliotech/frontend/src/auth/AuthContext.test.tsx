import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../api/types';
import { AuthProvider, useAuth } from './AuthContext';

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: {
    auth: {
      me: mocks.me,
      login: mocks.login,
      register: mocks.register,
    },
  },
  getToken: mocks.getToken,
  setToken: mocks.setToken,
  clearToken: mocks.clearToken,
}));

const user: User = {
  id: 'u1',
  email: 'ana@bibliotech.local',
  role: 'PROFESSOR',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function Consumer() {
  const { user: current, loading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="email">{current?.email ?? 'anon'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button type="button" onClick={() => void login('ana@bibliotech.local', 'secret123')}>
        login
      </button>
      <button type="button" onClick={() => void register('ana@bibliotech.local', 'secret123')}>
        register
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getToken.mockReturnValue(null);
  });

  it('starts anonymous without a stored token', () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('email')).toHaveTextContent('anon');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(mocks.me).not.toHaveBeenCalled();
  });

  it('restores the session when a token exists', async () => {
    mocks.getToken.mockReturnValue('jwt');
    mocks.me.mockResolvedValue(user);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent(user.email));
    expect(mocks.me).toHaveBeenCalled();
  });

  it('clears an invalid stored session', async () => {
    mocks.getToken.mockReturnValue('jwt');
    mocks.me.mockRejectedValue(new Error('expirado'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('email')).toHaveTextContent('anon');
    expect(mocks.clearToken).toHaveBeenCalled();
  });

  it('logs in and stores the token', async () => {
    mocks.login.mockResolvedValue({ accessToken: 'new-jwt', user });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent(user.email));
    expect(mocks.setToken).toHaveBeenCalledWith('new-jwt');
  });

  it('registers and stores the token', async () => {
    mocks.register.mockResolvedValue({ accessToken: 'new-jwt', user });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'register' }));

    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent(user.email));
    expect(mocks.setToken).toHaveBeenCalledWith('new-jwt');
  });

  it('logs out', async () => {
    mocks.getToken.mockReturnValue('jwt');
    mocks.me.mockResolvedValue(user);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent(user.email));
    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(mocks.clearToken).toHaveBeenCalled();
    expect(screen.getByTestId('email')).toHaveTextContent('anon');
  });

  it('requires the provider', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Consumer />)).toThrow('useAuth debe usarse dentro de AuthProvider');
    silence.mockRestore();
  });
});
