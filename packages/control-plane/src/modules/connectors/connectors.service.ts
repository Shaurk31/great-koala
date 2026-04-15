import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThirdPartyAccount } from './third-party-account.entity';
import { GmailProvider } from './oauth/gmail.provider';

@Injectable()
export class ConnectorsService {
  private readonly logger = new Logger(ConnectorsService.name);

  constructor(
    @InjectRepository(ThirdPartyAccount)
    private readonly accounts: Repository<ThirdPartyAccount>,
    private readonly gmailProvider: GmailProvider,
  ) {}

  async listForTenant(tenantId: string) {
    return this.accounts.find({ where: { tenantId } });
  }

  async createMockAccount(tenantId: string, accountType: string, email: string) {
    const account = this.accounts.create({
      tenantId,
      accountType,
      externalEmail: email,
      syncStatus: 'active',
    });
    return this.accounts.save(account);
  }

  async getGmailOAuthUrl(tenantId: string) {
    return this.gmailProvider.getAuthorizationUrl(tenantId);
  }

  async handleGmailOAuthCallback(code: string, state: string) {
    const tokens = await this.gmailProvider.exchangeCode(code);
    const tenantId = state;

    await this.gmailProvider.storeTenantSecret(tenantId, tokens);

    const account = this.accounts.create({
      tenantId,
      accountType: 'gmail',
      externalEmail: tokens.email || 'unknown',
      externalId: tokens.userId || 'gmail-user',
      secretRefId: `gmail-oauth-${tenantId}`,
      syncStatus: 'active',
    });

    this.logger.log(`Created Gmail connector for tenant ${tenantId}`);
    return this.accounts.save(account);
  }

  async disconnectAccount(accountId: string, tenantId: string) {
    const account = await this.accounts.findOne({ where: { id: accountId, tenantId } });
    if (!account) {
      throw new NotFoundException('Connector account not found');
    }

    account.syncStatus = 'disconnected';
    this.logger.log(`Disconnected ${account.accountType} account ${account.id} for tenant ${tenantId}`);
    return this.accounts.save(account);
  }
}
