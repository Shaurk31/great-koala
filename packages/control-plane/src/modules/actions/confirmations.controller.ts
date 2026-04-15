import { Body, Controller, Param, Post } from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('api/confirmations')
export class ConfirmationsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post(':token')
  async confirmWithToken(@Param('token') token: string, @Body() body: { confirm: boolean }) {
    const action = await this.actionsService.confirmActionByToken(token, body.confirm);
    return { success: true, data: action };
  }

  @Post('respond')
  async respond(@Body() body: { tenantId: string; senderPhone: string; externalThreadId: string; confirm: boolean }) {
    const action = await this.actionsService.confirmActionByThread(
      body.tenantId,
      body.senderPhone,
      body.externalThreadId,
      body.confirm,
    );
    if (!action) {
      return { success: false, error: 'No pending confirmation found for this thread' };
    }
    return { success: true, data: action };
  }
}
