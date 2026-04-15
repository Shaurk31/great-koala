import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutingIdentity } from './routing-identity.entity';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoutingIdentity])],
  providers: [RoutingService],
  controllers: [RoutingController],
  exports: [RoutingService],
})
export class RoutingModule {}
