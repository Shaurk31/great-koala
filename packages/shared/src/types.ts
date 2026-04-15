/**
 * Message Event Contract
 * Sent from bridge to tenant OpenClaw gateway
 */
export interface MessageEvent {
  tenantId: string;
  channel: "imessage";
  externalThreadId: string;
  externalMessageId: string;
  sender: {
    phone: string;
    displayName?: string;
  };
  text: string;
  receivedAt: string;
}

/**
 * Assistant Reply
 * Returned from OpenClaw gateway to bridge
 */
export interface AssistantReply {
  type: "reply";
  text: string;
}

/**
 * Confirmation Request
 * When action needs user approval
 */
export interface ConfirmationRequest {
  type: "confirm";
  text: string;
  actionId: string;
  summary: string;
}

/**
 * Direct Execution
 * Pre-approved or low-risk action
 */
export interface DirectExecution {
  type: "execute";
  actionId: string;
  operations: ToolOperation[];
  replyTextAfterExecution?: string;
}

/**
 * Assistant Result Union
 */
export type AssistantResult =
  | AssistantReply
  | ConfirmationRequest
  | DirectExecution;

/**
 * Tool Operation for OpenClaw execution
 */
export interface ToolOperation {
  tool: string;
  action: string;
  params: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Action Risk Levels
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Action Status
 */
export type ActionStatus =
  | "pending_confirmation"
  | "executing"
  | "executed"
  | "failed"
  | "cancelled";

/**
 * Action Record for Audit Trail
 */
export interface ActionRecord {
  id: string;
  tenantId: string;
  sourceChannel: "imessage";
  sourceThreadId: string;
  requestedBy: string;
  intent: string;
  operations: ToolOperation[];
  riskLevel: RiskLevel;
  status: ActionStatus;
  confirmationToken?: string;
  errorMessage?: string;
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
}

/**
 * Policy Rule Definition
 */
export interface PolicyRule {
  id: string;
  tenantId: string;
  intent: string;
  tool: string;
  action: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  requiresDashboardApproval: boolean;
  autoExecute: boolean;
  conditions?: Record<string, unknown>;
  createdAt: string;
}
