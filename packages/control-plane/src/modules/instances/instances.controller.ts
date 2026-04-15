import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InstancesService } from './instances.service';

@Controller('api/instances')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':tenantId')
  async getInstanceByTenant(@Param('tenantId') tenantId: string) {
    const instance = await this.instancesService.getByTenantId(tenantId);
    return { success: true, data: instance };
  }
}
