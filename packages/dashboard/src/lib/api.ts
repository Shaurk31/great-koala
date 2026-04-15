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

export async function getProfile(token: string) {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function getTenants(token: string) {
  const response = await fetch(`${API_URL}/api/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function createTenant(name: string, phone: string | undefined, token: string) {
  const response = await fetch(`${API_URL}/api/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, phone }),
  });
  return response.json();
}

export async function getActions(tenantId: string, token: string) {
  const response = await fetch(`${API_URL}/api/actions?tenantId=${tenantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function getConnectors(tenantId: string, token: string) {
  const response = await fetch(`${API_URL}/api/connectors?tenantId=${tenantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function startGmailOAuth(tenantId: string, token: string) {
  const response = await fetch(`${API_URL}/api/connectors/gmail/oauth-start?tenantId=${tenantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
