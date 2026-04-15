import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyRule } from './policy-rule.entity';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyRule])],
  providers: [PoliciesService],
  controllers: [PoliciesController],
  exports: [PoliciesService],
})
export class PoliciesModule {}
