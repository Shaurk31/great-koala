import { Body, Controller, Get, Param, Query, Redirect, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectorsService } from './connectors.service';

@Controller('api/connectors')
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('tenantId') tenantId: string) {
    const connectors = await this.connectorsService.listForTenant(tenantId);
    return { success: true, data: connectors };
  }

  @UseGuards(JwtAuthGuard)
  @Get('gmail/oauth-start')
  async startGmailOAuth(@Query('tenantId') tenantId: string) {
    const url = await this.connectorsService.getGmailOAuthUrl(tenantId);
    return { success: true, data: { url } };
  }

  @Get('gmail/oauth-callback')
  async finishGmailOAuth(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.connectorsService.handleGmailOAuthCallback(code, state);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/connections?connected=true`);
  }

  @UseGuards(JwtAuthGuard)
  @Post('gmail/mock-connect')
  async connectGmail(@Body() body: { tenantId: string; email: string }) {
    const account = await this.connectorsService.createMockAccount(body.tenantId, 'gmail', body.email);
    return { success: true, data: account };
  }
}
