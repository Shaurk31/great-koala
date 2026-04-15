import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { AwsSecretsManagerService } from '../aws-secrets.service';

interface GmailTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GmailTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  email: string;
  userId: string;
}

@Injectable()
export class GmailProvider {
  private readonly logger = new Logger(GmailProvider.name);
  private readonly clientId = process.env.GMAIL_CLIENT_ID || '';
  private readonly clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
  private readonly redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/api/connectors/gmail/oauth-callback';
  private readonly scope = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ].join(' ');

  constructor(private readonly awsSecretsManagerService: AwsSecretsManagerService) {}

  getAuthorizationUrl(tenantId: string) {
    if (!this.clientId) {
      throw new InternalServerErrorException('GMAIL_CLIENT_ID is not configured');
    }

    const state = tenantId;
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: this.scope,
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<GmailTokenResult> {
    if (!this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException('GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET not configured');
    }

    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await axios.post<GmailTokenResponse>('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenData = response.data;
    let email = '';
    let userId = '';

    try {
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      email = userInfoResponse.data.email || '';
      userId = userInfoResponse.data.id || email || 'gmail-user';
    } catch (error) {
      this.logger.warn('Unable to fetch Gmail user info after token exchange.');
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      email,
      userId,
    };
  }

  async storeTenantSecret(tenantId: string, tokens: GmailTokenResult) {
    const secretName = `gmail-oauth-${tenantId}`;
    await this.awsSecretsManagerService.storeSecret(secretName, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      scope: tokens.scope,
      email: tokens.email,
      userId: tokens.userId,
      createdAt: new Date().toISOString(),
    });
  }

  async refreshAccessToken(refreshToken: string) {
    if (!this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException('GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await axios.post<GmailTokenResponse>('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
      scope: response.data.scope,
      tokenType: response.data.token_type,
    };
  }
}
