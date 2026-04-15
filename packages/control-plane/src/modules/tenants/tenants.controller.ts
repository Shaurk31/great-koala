import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@Controller('api/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTenant(@Request() req: any, @Body() body: { name: string; phone?: string }) {
    const userId = req.user.userId;
    const tenant = await this.tenantsService.create(userId, body.name, body.phone);
    return { success: true, tenant };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listTenants(@Request() req: any) {
    const userId = req.user.userId;
    const tenants = await this.tenantsService.listForUser(userId);
    return { success: true, data: tenants };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':tenantId')
  async getTenant(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantsService.getById(tenantId);
    return { success: true, tenant };
  }
}
