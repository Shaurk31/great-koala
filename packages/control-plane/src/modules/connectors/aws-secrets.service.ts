import { Injectable, Logger } from '@nestjs/common';
import AWS from 'aws-sdk';

@Injectable()
export class AwsSecretsManagerService {
  private readonly logger = new Logger(AwsSecretsManagerService.name);
  private readonly client: AWS.SecretsManager | null;

  constructor() {
    if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.client = new AWS.SecretsManager({ region: process.env.AWS_REGION });
    } else {
      this.client = null;
      this.logger.warn('AWS Secrets Manager credentials are not fully configured. Secrets store is disabled.');
    }
  }

  isConfigured() {
    return !!this.client;
  }

  async storeSecret(secretName: string, secretValue: unknown) {
    if (!this.client) {
      this.logger.warn(`Unable to store secret ${secretName}: AWS Secrets Manager not configured.`);
      return null;
    }

    const secretString = JSON.stringify(secretValue);

    try {
      const createResponse = await this.client.createSecret({
        Name: secretName,
        SecretString: secretString,
      }).promise();
      return createResponse;
    } catch (error: any) {
      if (error?.code === 'ResourceExistsException') {
        this.logger.log(`Secret ${secretName} already exists. Updating existing secret.`);
        return this.client.updateSecret({
          SecretId: secretName,
          SecretString: secretString,
        }).promise();
      }
      this.logger.error(`Failed to store secret ${secretName}`, error?.message || error);
      throw error;
    }
  }
}
