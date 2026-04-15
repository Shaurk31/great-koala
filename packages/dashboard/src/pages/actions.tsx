'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth';
import { confirmAction, getActionById, getActions, getTenants } from '../lib/api';

type ActionRecord = {
  id: string;
  intent: string;
  status: string;
  riskLevel: string;
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
  operations?: unknown[];
  errorMessage?: string;
};

type Tenant = {
  id: string;
  name: string;
};

export default function ActionHistory() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAction, setSelectedAction] = useState<ActionRecord | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionMutationLoading, setActionMutationLoading] = useState(false);
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

  const filteredActions =
    statusFilter === 'all' ? actions : actions.filter((action) => action.status === statusFilter);

  const handleViewDetails = async (actionId: string) => {
    if (!token) return;
    setDetailsLoading(true);
    const response = await getActionById(actionId, token);
    if (response.success) {
      setSelectedAction(response.data as ActionRecord);
    }
    setDetailsLoading(false);
  };

  const refreshActions = async () => {
    if (!token || !selectedTenantId) return;
    const actionResponse = await getActions(selectedTenantId, token);
    if (actionResponse.success) {
      setActions(actionResponse.data || []);
    }
  };

  const handleConfirmAction = async (confirm: boolean) => {
    if (!token || !selectedAction) return;
    setActionMutationLoading(true);
    const response = await confirmAction(selectedAction.id, confirm, token);
    if (response.success) {
      setSelectedAction(response.data as ActionRecord);
      await refreshActions();
    }
    setActionMutationLoading(false);
  };

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

        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <label className="text-sm font-medium text-gray-700">Status filter</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ml-3 rounded-md border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600"
          >
            <option value="all">All</option>
            <option value="pending_confirmation">Pending confirmation</option>
            <option value="executing">Executing</option>
            <option value="executed">Executed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Intent</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Risk</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No actions recorded for this workspace yet.
                  </td>
                </tr>
              ) : (
                filteredActions.map((action) => (
                  <tr key={action.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{action.intent}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{action.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{action.riskLevel}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(action.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <button
                        onClick={() => handleViewDetails(action.id)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Execution details</h2>
          {detailsLoading ? <p className="mt-4 text-sm text-gray-500">Loading details...</p> : null}
          {!detailsLoading && !selectedAction ? (
            <p className="mt-4 text-sm text-gray-500">Select an action to view full execution details.</p>
          ) : null}
          {!detailsLoading && selectedAction ? (
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p><strong>ID:</strong> {selectedAction.id}</p>
              <p><strong>Intent:</strong> {selectedAction.intent}</p>
              <p><strong>Status:</strong> {selectedAction.status}</p>
              <p><strong>Risk:</strong> {selectedAction.riskLevel}</p>
              <p><strong>Created:</strong> {new Date(selectedAction.createdAt).toLocaleString()}</p>
              <p><strong>Executed:</strong> {selectedAction.executedAt ? new Date(selectedAction.executedAt).toLocaleString() : 'N/A'}</p>
              <p><strong>Completed:</strong> {selectedAction.completedAt ? new Date(selectedAction.completedAt).toLocaleString() : 'N/A'}</p>
              <p><strong>Error:</strong> {selectedAction.errorMessage || 'None'}</p>
              <div>
                <p className="font-semibold">Operations</p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                  {JSON.stringify(selectedAction.operations || [], null, 2)}
                </pre>
              </div>

              {selectedAction.status === 'pending_confirmation' ? (
                <div className="mt-4 flex gap-3">
                  <button
                    disabled={actionMutationLoading}
                    onClick={() => handleConfirmAction(true)}
                    className="rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionMutationLoading}
                    onClick={() => handleConfirmAction(false)}
                    className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
