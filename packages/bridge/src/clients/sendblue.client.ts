import axios, { AxiosInstance } from 'axios';

export interface SendblueMessagePayload {
  to: string;
  text: string;
  externalThreadId?: string;
}

export interface SendblueSendResult {
  success: boolean;
  sent: boolean;
  status: 'sent' | 'skipped' | 'failed';
  attempts: number;
  warning?: string;
  error?: string;
  payload: SendblueMessagePayload;
  providerResponse?: unknown;
}

export class SendblueClient {
  private client: AxiosInstance;
  private apiKey: string;
  private readonly maxRetries: number;

  constructor(apiUrl: string, apiKey: string) {
    this.client = axios.create({ baseURL: apiUrl, timeout: 10000 });
    this.apiKey = apiKey;
    this.maxRetries = Number(process.env.SENDBLUE_MAX_RETRIES || 3);
  }

  async sendMessage(payload: SendblueMessagePayload): Promise<SendblueSendResult> {
    if (!this.apiKey) {
      return {
        success: true,
        sent: false,
        status: 'skipped',
        attempts: 0,
        warning: 'No Sendblue API key configured; message logged for development',
        payload,
      };
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.client.post('/messages', payload, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        return {
          success: true,
          sent: true,
          status: 'sent',
          attempts: attempt,
          payload,
          providerResponse: response.data,
        };
      } catch (error: any) {
        const statusCode = error?.response?.status as number | undefined;
        const shouldRetry = statusCode === undefined || statusCode >= 500;
        lastError = error;
        if (!shouldRetry || attempt === this.maxRetries) {
          break;
        }
      }
    }

    return {
      success: false,
      sent: false,
      status: 'failed',
      attempts: this.maxRetries,
      error: lastError instanceof Error ? lastError.message : 'Unknown Sendblue error',
      payload,
    };
  }
}
