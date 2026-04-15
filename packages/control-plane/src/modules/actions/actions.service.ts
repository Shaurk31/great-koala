import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionRecord } from './action-record.entity';
import { ConfirmationToken } from './confirmation-token.entity';
import { ToolExecution } from './tool-execution.entity';
import { PoliciesService } from '../policies/policies.service';

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(ActionRecord)
    private readonly actionRecords: Repository<ActionRecord>,
    @InjectRepository(ConfirmationToken)
    private readonly confirmationTokens: Repository<ConfirmationToken>,
    @InjectRepository(ToolExecution)
    private readonly toolExecutions: Repository<ToolExecution>,
    private readonly policiesService: PoliciesService,
  ) {}

  async createActionRecord(payload: {
    tenantId: string;
    sourceChannel: string;
    sourceThreadId: string;
    requestedBy: string;
    intent: string;
    operations: unknown[];
    riskLevel: string;
    status: string;
    confirmationTokenId?: string;
  }) {
    const record = this.actionRecords.create(payload);
    return this.actionRecords.save(record);
  }

  async createConfirmation(actionId: string, tenantId: string, sender: string, threadId: string) {
    const token = `confirm_${Math.random().toString(36).slice(2, 12)}`;
    const confirmation = this.confirmationTokens.create({
      tenantId,
      actionRecordId: actionId,
      token,
      externalThreadId: threadId,
      senderPhone: sender,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      status: 'pending',
    });
    return this.confirmationTokens.save(confirmation);
  }

  async getActionHistory(tenantId: string) {
    return this.actionRecords.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async getActionById(actionId: string) {
    const action = await this.actionRecords.findOne({ where: { id: actionId } });
    if (!action) throw new NotFoundException('Action not found');
    return action;
  }

  async findPendingAction(tenantId: string, senderPhone: string, externalThreadId: string) {
    return this.actionRecords.findOne({
      where: {
        tenantId,
        sourceChannel: 'imessage',
        sourceThreadId: externalThreadId,
        requestedBy: senderPhone,
        status: 'pending_confirmation',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingConfirmationByToken(token: string) {
    return this.confirmationTokens.findOne({
      where: { token, status: 'pending' },
      relations: ['actionRecord'],
    });
  }

  async confirmActionByToken(token: string, confirm: boolean) {
    const confirmation = await this.findPendingConfirmationByToken(token);
    if (!confirmation) throw new NotFoundException('Confirmation token not found');
    const action = await this.confirmAction(confirmation.actionRecordId, confirm);
    confirmation.status = confirm ? 'confirmed' : 'cancelled';
    confirmation.respondedAt = new Date();
    await this.confirmationTokens.save(confirmation);
    return action;
  }

  async confirmActionByThread(tenantId: string, senderPhone: string, externalThreadId: string, confirm: boolean) {
    const action = await this.findPendingAction(tenantId, senderPhone, externalThreadId);
    if (!action) return null;
    const pendingToken = await this.confirmationTokens.findOne({
      where: {
        actionRecordId: action.id,
        status: 'pending',
      },
    });
    if (pendingToken) {
      pendingToken.status = confirm ? 'confirmed' : 'cancelled';
      pendingToken.respondedAt = new Date();
      await this.confirmationTokens.save(pendingToken);
    }
    return this.confirmAction(action.id, confirm);
  }

  async confirmAction(actionId: string, confirm: boolean) {
    const action = await this.getActionById(actionId);
    if (action.status !== 'pending_confirmation') {
      return action;
    }
    action.status = confirm ? 'executing' : 'cancelled';
    action.executedAt = new Date();
    if (!confirm) {
      action.completedAt = new Date();
      await this.actionRecords.save(action);
      return action;
    }

    await this.actionRecords.save(action);
    await this.executeAction(action);
    return action;
  }

  async executeAction(action: ActionRecord) {
    for (const operation of action.operations as Array<{ tool: string; action: string; params: unknown }>) {
      await this.logToolExecution({
        tenantId: action.tenantId,
        actionRecordId: action.id,
        tool: operation.tool,
        action: operation.action,
        params: operation.params,
        status: 'success',
        result: { message: 'Mock tool execution completed' },
      });
    }

    action.status = 'executed';
    action.completedAt = new Date();
    await this.actionRecords.save(action);
    return action;
  }

  async logToolExecution(payload: {
    tenantId: string;
    actionRecordId: string;
    tool: string;
    action: string;
    params: unknown;
    result?: unknown;
    status: string;
    error?: string;
  }) {
    const execution = this.toolExecutions.create({
      ...payload,
      executedAt: new Date(),
      completedAt: new Date(),
    });
    return this.toolExecutions.save(execution);
  }

  async completeAction(actionId: string, result: unknown) {
    const action = await this.getActionById(actionId);
    action.status = 'executed';
    action.completedAt = new Date();
    await this.actionRecords.save(action);
    return action;
  }
}
