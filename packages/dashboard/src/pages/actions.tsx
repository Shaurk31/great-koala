'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth';
import { getActions, getTenants } from '../lib/api';

type ActionRecord = {
  id: string;
  intent: string;
  status: string;
  riskLevel: string;
  createdAt: string;
};

type Tenant = {
  id: string;
  name: string;
};

export default function ActionHistory() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    if (!token) return;

    const loadTenants = async () => {
      const tenantResponse = await getTenants(token);
      if (tenantResponse.success) {
        setTenants(tenantResponse.data || []);
        if (tenantResponse.data.length > 0) {
          setSelectedTenantId(tenantResponse.data[0].id);
        }
      }
      setLoading(false);
    };

    loadTenants();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedTenantId) return;

    const loadActions = async () => {
      const actionResponse = await getActions(selectedTenantId, token);
      if (actionResponse.success) {
        setActions(actionResponse.data || []);
      } else {
        setError(actionResponse.error || 'Unable to load action history');
      }
    };

    loadActions();
  }, [selectedTenantId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading action history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Action History</h1>
            <p className="mt-2 text-gray-600">Review all assistant actions and policy decisions for your workspace.</p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <label className="text-sm font-medium text-gray-700">Workspace</label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="mt-2 rounded-md border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Intent</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Risk</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No actions recorded for this workspace yet.
                  </td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{action.intent}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{action.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{action.riskLevel}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(action.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
