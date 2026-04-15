import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantInstance } from './tenant-instance.entity';
import { InstancesService } from './instances.service';
import { InstancesController } from './instances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TenantInstance])],
  providers: [InstancesService],
  controllers: [InstancesController],
  exports: [InstancesService],
})
export class InstancesModule {}
