'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getToken } from '../lib/auth';
import { disconnectConnector, getConnectors, getTenants, startGmailOAuth } from '../lib/api';

type Tenant = {
  id: string;
  name: string;
};

type Connector = {
  id: string;
  accountType: string;
  externalEmail?: string;
  syncStatus: string;
};

export default function Connections() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [disconnectingConnectorId, setDisconnectingConnectorId] = useState<string | null>(null);
  const token = getToken();
  const router = useRouter();

  const loadConnectors = async (tenantId: string, authToken: string) => {
    const connectorResponse = await getConnectors(tenantId, authToken);
    if (connectorResponse.success) {
      setConnectors(connectorResponse.data || []);
    }
  };

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
    };

    loadTenants().finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedTenantId) return;

    loadConnectors(selectedTenantId, token);
  }, [selectedTenantId, token]);

  const handleGmailConnect = async () => {
    if (!token || !selectedTenantId) {
      setError('Please select a workspace before connecting.');
      return;
    }
    setError(null);

    const response = await startGmailOAuth(selectedTenantId, token);
    if (!response.success) {
      setError(response.error || 'Unable to start Gmail authorization');
      return;
    }

    window.location.href = response.data.url;
  };

  const handleDisconnect = async (connectorId: string) => {
    if (!token || !selectedTenantId) return;
    setDisconnectingConnectorId(connectorId);
    setError(null);
    setSuccessMessage('');

    const response = await disconnectConnector(connectorId, selectedTenantId, token);
    if (!response.success) {
      setError(response.error || 'Unable to disconnect account');
      setDisconnectingConnectorId(null);
      return;
    }

    setSuccessMessage('Connector disconnected.');
    await loadConnectors(selectedTenantId, token);
    setDisconnectingConnectorId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connected Accounts</h1>
            <p className="mt-2 text-gray-600">Manage OAuth connectors for your workspace.</p>
          </div>
          <div className="space-x-3">
            <button
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/')}
            >
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 text-sm text-gray-500">Workspace</div>
          <div className="flex flex-wrap gap-3">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => setSelectedTenantId(tenant.id)}
                className={`rounded-full border px-4 py-2 text-sm ${selectedTenantId === tenant.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {tenant.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gmail</h2>
              <p className="mt-1 text-sm text-gray-600">Authorize Gmail access for email and inbox tools.</p>
            </div>
            <button
              type="button"
              onClick={handleGmailConnect}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Connect Gmail
            </button>
          </div>
          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
          {successMessage ? <div className="mt-4 text-sm text-green-600">{successMessage}</div> : null}
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Connected accounts</h2>
          <div className="mt-4 space-y-4">
            {connectors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600">
                No connected accounts yet. Connect Gmail to start syncing email data.
              </div>
            ) : (
              connectors.map((connector) => (
                <div key={connector.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{connector.accountType.toUpperCase()}</p>
                      <p className="text-sm text-gray-500">{connector.externalEmail || 'No email available'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                        {connector.syncStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(connector.id)}
                        disabled={disconnectingConnectorId === connector.id || connector.syncStatus === 'disconnected'}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
