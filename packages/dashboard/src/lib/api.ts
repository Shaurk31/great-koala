import { authFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function register(email: string, password: string, name?: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return response.json();
}

export async function refreshSession(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return response.json();
}

export async function getProfile(token: string) {
  return authFetch(`${API_URL}/api/auth/profile`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function getTenants(token: string) {
  return authFetch(`${API_URL}/api/tenants`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function createTenant(name: string, phone: string | undefined, token: string) {
  return authFetch(`${API_URL}/api/tenants`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ name, phone }),
  });
}

export async function getActions(tenantId: string, token: string) {
  return authFetch(`${API_URL}/api/actions?tenantId=${tenantId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function getActionById(actionId: string, token: string) {
  return authFetch(`${API_URL}/api/actions/${actionId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function confirmAction(actionId: string, confirm: boolean, token: string) {
  return authFetch(`${API_URL}/api/actions/${actionId}/confirm`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ confirm }),
  });
}

export async function getConnectors(tenantId: string, token: string) {
  return authFetch(`${API_URL}/api/connectors?tenantId=${tenantId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function startGmailOAuth(tenantId: string, token: string) {
  return authFetch(`${API_URL}/api/connectors/gmail/oauth-start?tenantId=${tenantId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function disconnectConnector(connectorId: string, tenantId: string, token: string) {
  return authFetch(`${API_URL}/api/connectors/${connectorId}/disconnect`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ tenantId }),
  });
}
