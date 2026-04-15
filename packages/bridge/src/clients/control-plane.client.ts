import axios, { AxiosInstance } from 'axios';

export interface ControlPlaneRoutingIdentity {
  id: string;
  tenantId: string;
  sendblueAccount: string;
  phoneNumber: string;
  externalThreadId?: string;
  tenantIdentifier?: string;
  isActive: boolean;
}

export interface ControlPlaneMessagePayload {
  text: string;
  externalThreadId: string;
  sender: { phone: string; displayName?: string };
}

export class ControlPlaneClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({ baseURL: baseUrl, timeout: 10000 });
  }

  async resolveRouting(sendblueAccount: string, phoneNumber: string, externalThreadId?: string) {
    const response = await this.client.post('/api/routing/resolve', {
      sendblueAccount,
      phoneNumber,
      externalThreadId,
    });
    return response.data.data as ControlPlaneRoutingIdentity;
  }

  async getInstance(tenantId: string) {
    const response = await this.client.get(`/api/instances/${tenantId}`);
    return response.data.data;
  }

  async forwardMessage(tenantId: string, payload: ControlPlaneMessagePayload) {
    const response = await this.client.post(`/runtime/${tenantId}/message`, payload);
    return response.data;
  }

  async confirmResponse(tenantId: string, senderPhone: string, externalThreadId: string, confirm: boolean) {
    const response = await this.client.post('/api/confirmations/respond', {
      tenantId,
      senderPhone,
      externalThreadId,
      confirm,
    });
    return response.data;
  }

  async confirmWithToken(token: string, confirm: boolean) {
    const response = await this.client.post(`/api/confirmations/${token}`, { confirm });
    return response.data;
  }
}
