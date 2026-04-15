import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdPartyAccount } from './third-party-account.entity';
import { ConnectorsService } from './connectors.service';
import { ConnectorsController } from './connectors.controller';
import { GmailProvider } from './oauth/gmail.provider';
import { AwsSecretsManagerService } from './aws-secrets.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThirdPartyAccount])],
  providers: [ConnectorsService, GmailProvider, AwsSecretsManagerService],
  controllers: [ConnectorsController],
  exports: [ConnectorsService],
})
export class ConnectorsModule {}
