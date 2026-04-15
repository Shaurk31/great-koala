import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { RuntimeController } from './runtime.controller';
import { PoliciesModule } from '../policies/policies.module';
import { ActionsModule } from '../actions/actions.module';
import { InstancesModule } from '../instances/instances.module';

@Module({
  imports: [PoliciesModule, ActionsModule, InstancesModule],
  providers: [RuntimeService],
  controllers: [RuntimeController],
})
export class RuntimeModule {}
