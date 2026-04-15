// Core types
export * from "./types";

// Database models
export {
  User,
  Tenant,
  TenantInstance,
  RoutingIdentity,
  ThirdPartyAccount,
  SecretRef,
  MessageEvent as DatabaseMessageEvent,
  AssistantRun,
  ActionRecord as DatabaseActionRecord,
  ConfirmationToken,
  ToolExecution,
  AuditLog,
  UsageRecord,
  Subscription,
} from "./database";

// API types
export * from "./api";

// Constants
export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const ACTION_STATUS = {
  PENDING_CONFIRMATION: "pending_confirmation",
  EXECUTING: "executing",
  EXECUTED: "executed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const CHANNELS = {
  IMESSAGE: "imessage",
} as const;

export const ACCOUNT_TYPES = {
  GMAIL: "gmail",
  GOOGLE_CALENDAR: "google_calendar",
  APPLE_NOTES: "apple_notes",
  TODOIST: "todoist",
  NOTION: "notion",
} as const;
