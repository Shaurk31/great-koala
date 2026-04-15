/**
 * Database Models for PostgreSQL Schema
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  clerkId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  subscription?: "free" | "pro" | "enterprise";
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantInstance {
  id: string;
  tenantId: string;
  hostname: string;
  internalUrl: string;
  port: number;
  healthStatus: "healthy" | "degraded" | "unhealthy" | "provisioning";
  deployedImageVersion: string;
  stateVolumeId: string;
  lastHeartbeat?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutingIdentity {
  id: string;
  tenantId: string;
  sendblueAccount: string;
  phoneNumber: string;
  externalThreadId: string;
  allowedSenders: string[]; // phone numbers
  tenantIdentifier: string; // maps to tenant_instances
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThirdPartyAccount {
  id: string;
  tenantId: string;
  accountType: "gmail" | "google_calendar" | "apple_notes" | "todoist" | "notion";
  externalId: string;
  externalEmail?: string;
  secretRefId: string; // reference to AWS Secrets Manager secret
  syncStatus: "active" | "inactive" | "error";
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretRef {
  id: string;
  tenantId: string;
  secretType: "oauth_token" | "api_key" | "encryption_key" | "webhook_token";
  awsSecretId: string; // ARN or ID in Secrets Manager
  awsRegion: string;
  description?: string;
  createdAt: Date;
  rotatedAt?: Date;
}

export interface MessageEvent {
  id: string;
  tenantId: string;
  externalMessageId: string;
  externalThreadId: string;
  senderPhone: string;
  senderName?: string;
  text: string;
  rawPayload: unknown;
  processedAt?: Date;
  createdAt: Date;
}

export interface AssistantRun {
  id: string;
  tenantId: string;
  messageEventId: string;
  sessionId: string; // OpenClaw session
  intent?: string;
  reasoningContent?: string;
  status: "processing" | "complete" | "error";
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ActionRecord {
  id: string;
  tenantId: string;
  assistantRunId: string;
  sourceChannel: "imessage";
  sourceThreadId: string;
  requestedBy: string;
  intent: string;
  operations: unknown[];
  riskLevel: "low" | "medium" | "high";
  status: "pending_confirmation" | "executed" | "failed" | "cancelled";
  confirmationTokenId?: string;
  errorMessage?: string;
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
}

export interface ConfirmationToken {
  id: string;
  tenantId: string;
  actionRecordId: string;
  token: string;
  externalThreadId: string;
  senderPhone: string;
  expiresAt: Date;
  status: "pending" | "confirmed" | "rejected" | "expired";
  respondedAt?: Date;
  createdAt: Date;
}

export interface ToolExecution {
  id: string;
  tenantId: string;
  actionRecordId: string;
  tool: string;
  action: string;
  params: unknown;
  result?: unknown;
  error?: string;
  status: "pending" | "executing" | "success" | "failure";
  executedAt?: Date;
  completedAt?: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  billingPeriod: string; // YYYY-MM
  messageCount: number;
  actionCount: number;
  modelTokens: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeSubscriptionId: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}
