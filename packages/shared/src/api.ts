/**
 * API Response Types
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  phone?: string;
  subscription?: "free" | "pro" | "enterprise";
  runtimeStatus: "healthy" | "degraded" | "unavailable";
  connectedAccounts: string[];
  createdAt: string;
}

export interface ActionHistoryResponse {
  id: string;
  intent: string;
  status: "pending_confirmation" | "executed" | "failed" | "cancelled";
  riskLevel: "low" | "medium" | "high";
  operations: Array<{
    tool: string;
    action: string;
    status: string;
  }>;
  createdAt: string;
  executedAt?: string;
}

export interface WebhookEventResponse {
  success: boolean;
  actionId?: string;
  message?: string;
}
