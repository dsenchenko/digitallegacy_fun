import { useCallback, useEffect, useState } from 'react';
import { reconnectSocket } from '../socket';

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'Помилка авторизації');
  }
  return data;
}

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [authSource, setAuthSource] = useState(null);

  const refresh = useCallback(async () => {
    const data = await fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .catch(() => ({ authenticated: false, configured: false, authSource: null }));
    setAuthenticated(Boolean(data.authenticated));
    setConfigured(Boolean(data.configured));
    setAuthSource(data.authSource ?? null);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (password) => {
    await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(parseJsonResponse);
    await refresh();
    reconnectSocket();
  };

  const setup = async (password) => {
    await fetch('/api/auth/setup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(parseJsonResponse);
    await refresh();
    reconnectSocket();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    await refresh();
    reconnectSocket();
  };

  return {
    loading,
    authenticated,
    configured,
    authSource,
    login,
    setup,
    logout,
    refresh,
  };
}
