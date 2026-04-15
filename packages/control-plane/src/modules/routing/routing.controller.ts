import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoutingService } from './routing.service';

@Controller('api/routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: Partial<{ tenantId: string; sendblueAccount: string; phoneNumber: string; externalThreadId?: string; allowedSenders?: string[]; tenantIdentifier?: string }>) {
    const mapping = await this.routingService.create({
      tenantId: body.tenantId,
      sendblueAccount: body.sendblueAccount,
      phoneNumber: body.phoneNumber,
      externalThreadId: body.externalThreadId,
      allowedSenders: body.allowedSenders || [],
      tenantIdentifier: body.tenantIdentifier,
      isActive: true,
    });
    return { success: true, data: mapping };
  }

  @Post('resolve')
  async resolve(@Body() body: { sendblueAccount: string; phoneNumber: string; externalThreadId?: string }) {
    const identity = await this.routingService.resolve(body.sendblueAccount, body.phoneNumber, body.externalThreadId);
    return { success: true, data: identity };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    const identity = await this.routingService.getById(id);
    return { success: true, data: identity };
  }
}
