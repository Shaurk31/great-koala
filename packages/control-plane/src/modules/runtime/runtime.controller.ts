import { Body, Controller, Param, Post } from '@nestjs/common';
import { RuntimeService } from './runtime.service';

@Controller('runtime')
export class RuntimeController {
  constructor(private readonly runtimeService: RuntimeService) {}

  @Post(':tenantId/message')
  async handleMessage(
    @Param('tenantId') tenantId: string,
    @Body() body: { text: string; externalThreadId: string; sender: { phone: string; displayName?: string } },
  ) {
    return this.runtimeService.processMessage(tenantId, body);
  }
}
