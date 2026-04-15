import axios, { AxiosInstance } from 'axios';

export interface SendblueMessagePayload {
  to: string;
  text: string;
  externalThreadId?: string;
}

export class SendblueClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.client = axios.create({ baseURL: apiUrl, timeout: 10000 });
    this.apiKey = apiKey;
  }

  async sendMessage(payload: SendblueMessagePayload) {
    if (!this.apiKey) {
      return {
        success: true,
        sent: false,
        warning: 'No Sendblue API key configured; message logged for development',
        payload,
      };
    }

    const response = await this.client.post('/messages', payload, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }
}
