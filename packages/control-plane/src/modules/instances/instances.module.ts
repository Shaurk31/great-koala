import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantInstance } from './tenant-instance.entity';
import { InstancesService } from './instances.service';
import { InstancesController } from './instances.controller';
import { Provisioner } from './provisioner';

@Module({
  imports: [TypeOrmModule.forFeature([TenantInstance])],
  providers: [InstancesService, Provisioner],
  controllers: [InstancesController],
  exports: [InstancesService],
})
export class InstancesModule {}
