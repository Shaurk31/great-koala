import { Injectable } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { PoliciesService } from '../policies/policies.service';

@Injectable()
export class RuntimeService {
  constructor(
    private readonly policiesService: PoliciesService,
    private readonly actionsService: ActionsService,
  ) {}

  async processMessage(tenantId: string, message: { text: string; sender: { phone: string; displayName?: string }; externalThreadId: string }) {
    const lower = message.text.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) {
      return { type: 'reply' as const, text: 'Hi there! What can I help you with today?' };
    }

    if (lower.includes('archive') && lower.includes('email')) {
      const intent = 'archive recruiter emails';
      const operations = [
        {
          tool: 'gmail',
          action: 'archive',
          params: { query: 'recruiter', olderThanDays: 14 },
        },
      ];
      const evaluation = await this.policiesService.evaluateAction(tenantId, 'gmail', 'archive');
      const action = await this.actionsService.createActionRecord({
        tenantId,
        sourceChannel: 'imessage',
        sourceThreadId: message.externalThreadId,
        requestedBy: message.sender.phone,
        intent,
        operations,
        riskLevel: evaluation.riskLevel,
        status: evaluation.requiresConfirmation ? 'pending_confirmation' : 'executing',
      });
      if (evaluation.requiresConfirmation) {
        const token = await this.actionsService.createConfirmation(action.id, tenantId, message.sender.phone, message.externalThreadId);
        return {
          type: 'confirm' as const,
          text: `I found some recruiter emails older than 2 weeks. Archive them? Reply with yes to confirm.`,
          actionId: action.id,
          summary: 'Archive recruiter emails older than 2 weeks',
          confirmationToken: token.token,
        };
      }
      await this.actionsService.executeAction(action);
      return {
        type: 'reply' as const,
        text: 'Done — I archived the recruiter emails older than 2 weeks.',
      };
    }

    if (lower.includes('draft') && lower.includes('reply')) {
      const operations = [
        {
          tool: 'gmail',
          action: 'draft',
          params: { subject: 'Reply', body: 'Drafting a response for you.' },
        },
      ];
      const evaluation = await this.policiesService.evaluateAction(tenantId, 'gmail', 'draft');
      const action = await this.actionsService.createActionRecord({
        tenantId,
        sourceChannel: 'imessage',
        sourceThreadId: message.externalThreadId,
        requestedBy: message.sender.phone,
        intent: 'draft reply',
        operations,
        riskLevel: evaluation.riskLevel,
        status: evaluation.autoExecute ? 'executing' : 'pending_confirmation',
      });
      if (!evaluation.autoExecute) {
        const token = await this.actionsService.createConfirmation(action.id, tenantId, message.sender.phone, message.externalThreadId);
        return {
          type: 'confirm' as const,
          text: 'I can draft a reply for you. Confirm to continue?',
          actionId: action.id,
          summary: 'Draft reply to email',
          confirmationToken: token.token,
        };
      }
      await this.actionsService.executeAction(action);
      return {
        type: 'reply' as const,
        text: 'Your draft reply has been created and is ready in Gmail.',
      };
    }

    if (lower.includes('schedule') && lower.includes('lunch')) {
      const operations = [
        {
          tool: 'calendar',
          action: 'create_event',
          params: { title: 'Lunch', when: 'next week', attendees: ['Noah'] },
        },
      ];
      const evaluation = await this.policiesService.evaluateAction(tenantId, 'calendar', 'create_event');
      const action = await this.actionsService.createActionRecord({
        tenantId,
        sourceChannel: 'imessage',
        sourceThreadId: message.externalThreadId,
        requestedBy: message.sender.phone,
        intent: 'schedule lunch',
        operations,
        riskLevel: evaluation.riskLevel,
        status: evaluation.autoExecute ? 'executing' : 'pending_confirmation',
      });
      if (!evaluation.autoExecute) {
        const token = await this.actionsService.createConfirmation(action.id, tenantId, message.sender.phone, message.externalThreadId);
        return {
          type: 'confirm' as const,
          text: 'I can schedule lunch with Noah next week. Confirm to create the event?',
          actionId: action.id,
          summary: 'Schedule lunch with Noah',
          confirmationToken: token.token,
        };
      }
      await this.actionsService.executeAction(action);
      return {
        type: 'reply' as const,
        text: 'Lunch has been scheduled on your calendar.',
      };
    }

    return { type: 'reply' as const, text: 'I can help with email drafts, calendar events, and searching notes. Try asking me to archive recruiter emails or schedule lunch.' };
  }
}
