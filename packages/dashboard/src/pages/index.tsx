'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth';
import { createTenant, getActions, getProfile, getTenants } from '../lib/api';

type Tenant = {
  id: string;
  name: string;
  subscription: string;
  createdAt: string;
};

type ProfileResponse = {
  success: boolean;
  user: { id: string; email: string; name?: string };
};

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [actionCount, setActionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      const profileResponse = await getProfile(token);
      if (profileResponse.success) {
        setProfile(profileResponse);
      }
    };

    const loadTenants = async () => {
      const tenantResponse = await getTenants(token);
      if (tenantResponse.success) {
        setTenants(tenantResponse.data || []);
        const storedTenant = window.localStorage.getItem('great-koala-tenant');
        if (storedTenant && tenantResponse.data.some((tenant: Tenant) => tenant.id === storedTenant)) {
          setSelectedTenantId(storedTenant);
        } else if (tenantResponse.data.length > 0) {
          setSelectedTenantId(tenantResponse.data[0].id);
        }
      }
    };

    Promise.all([loadProfile(), loadTenants()]).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedTenantId) return;

    const loadActions = async () => {
      const actionResponse = await getActions(selectedTenantId, token);
      if (actionResponse.success) {
        setActionCount(Array.isArray(actionResponse.data) ? actionResponse.data.length : 0);
      }
    };

    loadActions();
  }, [selectedTenantId, token]);

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    window.localStorage.setItem('great-koala-tenant', tenantId);
  };

  const handleCreateTenant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !newTenantName.trim()) return;

    const response = await createTenant(newTenantName.trim(), newTenantPhone.trim(), token);
    if (response.success) {
      setTenants((current) => [...current, response.tenant]);
      setNewTenantName('');
      setNewTenantPhone('');
      handleTenantSelect(response.tenant.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {profile?.user.name || profile?.user.email || 'your assistant'}.
            </p>
          </div>
          {selectedTenantId ? (
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-500">Active workspace</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">
                {tenants.find((tenant) => tenant.id === selectedTenantId)?.name || 'Selected workspace'}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Workspaces</div>
            {tenants.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">No workspaces yet. Create one to get started.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => handleTenantSelect(tenant.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left ${selectedTenantId === tenant.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.subscription} plan</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow xl:col-span-2">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Connected accounts</div>
                <div className="mt-3 text-3xl font-semibold text-gray-900">{selectedTenantId ? '1+' : '0'}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Actions recorded</div>
                <div className="mt-3 text-3xl font-semibold text-gray-900">{actionCount}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="text-xs uppercase tracking-wide text-gray-500">Pending approvals</div>
                <div className="mt-3 text-3xl font-semibold text-gray-900">0</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Workspace status</p>
                  <p className="mt-2 text-sm text-gray-600">Create a workspace and connect at least one account to enable assistant actions.</p>
                </div>
                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create a new workspace</h2>
              <p className="mt-1 text-sm text-gray-600">Set up a tenant workspace for your assistant environment.</p>
            </div>
          </div>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTenant}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Workspace name</label>
              <input
                type="text"
                value={newTenantName}
                onChange={(event) => setNewTenantName(event.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone number (optional)</label>
              <input
                type="tel"
                value={newTenantPhone}
                onChange={(event) => setNewTenantPhone(event.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
            <div className="md:col-span-2">
              <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">
                Create workspace
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
