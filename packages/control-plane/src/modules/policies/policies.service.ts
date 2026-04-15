import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyRule } from './policy-rule.entity';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(PolicyRule)
    private readonly policyRules: Repository<PolicyRule>,
  ) {}

  async getTenantPolicies(tenantId: string) {
    return this.policyRules.find({ where: { tenantId } });
  }

  async upsertDefaultRules(tenantId: string) {
    const defaults = [
      {
        tool: 'gmail',
        action: 'search',
        riskLevel: 'low',
        requiresConfirmation: false,
        requiresDashboardApproval: false,
        autoExecute: true,
      },
      {
        tool: 'gmail',
        action: 'draft',
        riskLevel: 'medium',
        requiresConfirmation: false,
        requiresDashboardApproval: false,
        autoExecute: true,
      },
      {
        tool: 'gmail',
        action: 'send',
        riskLevel: 'high',
        requiresConfirmation: true,
        requiresDashboardApproval: false,
        autoExecute: false,
      },
      {
        tool: 'gmail',
        action: 'archive',
        riskLevel: 'medium',
        requiresConfirmation: true,
        requiresDashboardApproval: false,
        autoExecute: false,
      },
      {
        tool: 'calendar',
        action: 'create_event',
        riskLevel: 'medium',
        requiresConfirmation: false,
        requiresDashboardApproval: false,
        autoExecute: true,
      },
    ];

    for (const rule of defaults) {
      const existing = await this.policyRules.findOne({
        where: { tenantId, tool: rule.tool, action: rule.action },
      });
      if (!existing) {
        const record = this.policyRules.create({ tenantId, ...rule });
        await this.policyRules.save(record);
      }
    }
    return this.getTenantPolicies(tenantId);
  }

  async updatePolicy(policyId: string, updates: Partial<{ riskLevel: string; requiresConfirmation: boolean; autoExecute: boolean }>) {
    const rule = await this.policyRules.findOne({ where: { id: policyId } });
    if (!rule) {
      throw new Error('Policy rule not found');
    }
    if (updates.riskLevel !== undefined) rule.riskLevel = updates.riskLevel;
    if (updates.requiresConfirmation !== undefined) rule.requiresConfirmation = updates.requiresConfirmation;
    if (updates.autoExecute !== undefined) rule.autoExecute = updates.autoExecute;
    return this.policyRules.save(rule);
  }

  async evaluateAction(tenantId: string, tool: string, action: string) {
    const rule = await this.policyRules.findOne({ where: { tenantId, tool, action } });
    if (rule) {
      return {
        riskLevel: rule.riskLevel,
        requiresConfirmation: rule.requiresConfirmation,
        autoExecute: rule.autoExecute,
      };
    }

    const fallback = {
      riskLevel: 'medium',
      requiresConfirmation: true,
      autoExecute: false,
    };

    return fallback;
  }
}
