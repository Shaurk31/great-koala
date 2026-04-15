import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionRecord } from './action-record.entity';
import { ConfirmationToken } from './confirmation-token.entity';
import { ToolExecution } from './tool-execution.entity';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { ConfirmationsController } from './confirmations.controller';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActionRecord, ConfirmationToken, ToolExecution]), PoliciesModule],
  providers: [ActionsService],
  controllers: [ActionsController, ConfirmationsController],
  exports: [ActionsService],
})
export class ActionsModule {}
