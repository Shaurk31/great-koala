import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { RuntimeController } from './runtime.controller';
import { PoliciesModule } from '../policies/policies.module';
import { ActionsModule } from '../actions/actions.module';

@Module({
  imports: [PoliciesModule, ActionsModule],
  providers: [RuntimeService],
  controllers: [RuntimeController],
})
export class RuntimeModule {}
