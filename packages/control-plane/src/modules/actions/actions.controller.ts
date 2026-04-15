import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActionsService } from './actions.service';

@Controller('api/actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('tenantId') tenantId: string) {
    const actions = await this.actionsService.getActionHistory(tenantId);
    return { success: true, data: actions };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    const action = await this.actionsService.getActionById(id);
    return { success: true, data: action };
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Body() body: { confirm: boolean }) {
    const action = await this.actionsService.confirmAction(id, body.confirm);
    return { success: true, data: action };
  }
}
