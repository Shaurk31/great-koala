import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoliciesService } from './policies.service';

@Controller('api/policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('tenant/:tenantId')
  async getTenantPolicies(@Param('tenantId') tenantId: string) {
    const policies = await this.policiesService.getTenantPolicies(tenantId);
    return { success: true, data: policies };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':policyId')
  async updatePolicy(
    @Param('policyId') policyId: string,
    @Body() body: Partial<{ riskLevel: string; requiresConfirmation: boolean; autoExecute: boolean }> ,
  ) {
    const updated = await this.policiesService.updatePolicy(policyId, body);
    return { success: true, data: updated };
  }
}
