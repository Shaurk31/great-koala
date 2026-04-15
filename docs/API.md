# API Reference

## Control Plane API

Base URL: `http://localhost:3001`

### Authentication
All requests require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Tenants

#### Create Tenant
```
POST /api/tenants
Content-Type: application/json

{
  "name": "Alice's Workspace",
  "phone": "+1-555-0100"
}

Response 201:
{
  "id": "uuid",
  "name": "Alice's Workspace",
  "phone": "+1-555-0100",
  "subscription": "free",
  "runtimeStatus": "provisioning",
  "createdAt": "2026-04-14T10:00:00Z"
}
```

#### Get Tenant
```
GET /api/tenants/:tenantId

Response 200:
{
  "id": "uuid",
  "name": "Alice's Workspace",
  "phone": "+1-555-0100",
  "subscription": "free",
  "runtimeStatus": "healthy",
  "connectedAccounts": ["gmail", "google_calendar"],
  "createdAt": "2026-04-14T10:00:00Z"
}
```

#### List Tenants
```
GET /api/tenants?page=1&pageSize=20

Response 200:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

#### Update Tenant
```
PATCH /api/tenants/:tenantId
Content-Type: application/json

{
  "name": "Alice's Updated Workspace"
}

Response 200: {...}
```

### Connectors (OAuth Accounts)

#### Initiate Gmail OAuth
```
GET /api/connectors/gmail/oauth-start?tenantId=uuid

Response 302 Redirect:
Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

#### OAuth Callback (Google redirects here)
```
GET /api/connectors/gmail/oauth-callback?code=...&state=...

Response 302 Redirect:
Location: /dashboard?connected=true
```

#### List Connected Accounts
```
GET /api/tenants/:tenantId/connectors

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountType": "gmail",
      "externalEmail": "user@gmail.com",
      "syncStatus": "active",
      "lastSyncAt": "2026-04-14T09:00:00Z"
    }
  ]
}
```

#### Disconnect Account
```
DELETE /api/tenants/:tenantId/connectors/:connectorId

Response 204 No Content
```

### Actions (History & Audit)

#### List Action History
```
GET /api/tenants/:tenantId/actions?status=executed&riskLevel=high&page=1&pageSize=50

Query params:
- status: pending_confirmation | executed | failed | cancelled
- riskLevel: low | medium | high
- from: ISO date (earliest)
- to: ISO date (latest)
- page: integer
- pageSize: integer

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "intent": "archive recruiter emails",
      "status": "executed",
      "riskLevel": "medium",
      "operations": [
        {
          "tool": "gmail",
          "action": "archive",
          "status": "success"
        }
      ],
      "createdAt": "2026-04-14T10:00:00Z",
      "executedAt": "2026-04-14T10:01:00Z"
    }
  ],
  "pagination": {...}
}
```

#### Get Action Details
```
GET /api/tenants/:tenantId/actions/:actionId

Response 200:
{
  "id": "uuid",
  "intent": "archive recruiter emails",
  "status": "executed",
  "riskLevel": "medium",
  "operations": [{...}],
  "sourceThreadId": "abc123",
  "requestedBy": "+1-555-0100",
  "errorMessage": null,
  "createdAt": "2026-04-14T10:00:00Z",
  "executedAt": "2026-04-14T10:01:00Z"
}
```

#### Export Action History
```
GET /api/tenants/:tenantId/actions/export?format=csv&from=2026-04-01&to=2026-04-30

Response 200:
Content-Type: text/csv
[CSV file download]
```

### Policies

#### Get Tenant Policies
```
GET /api/tenants/:tenantId/policies

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "intent": "archive emails",
      "tool": "gmail",
      "action": "archive",
      "riskLevel": "medium",
      "requiresConfirmation": true,
      "autoExecute": false
    }
  ]
}
```

#### Update Policy
```
PATCH /api/tenants/:tenantId/policies/:policyId
Content-Type: application/json

{
  "riskLevel": "low",
  "autoExecute": true
}

Response 200: {...}
```

---

## Bridge Service API

Base URL: `http://localhost:3002`

### Webhooks

#### Sendblue Message Received
```
POST /webhooks/sendblue
Content-Type: application/json
X-Sendblue-Signature: sha256=...

{
  "type": "message.received",
  "id": "evt-123",
  "timestamp": "2026-04-14T10:00:00Z",
  "data": {
    "accountId": "acc-123",
    "message": {
      "id": "msg-456",
      "conversationId": "conv-789",
      "text": "archive recruiter emails",
      "from": {
        "phoneNumber": "+1-555-0100",
        "displayName": "Alice"
      },
      "timestamp": "2026-04-14T10:00:00Z"
    }
  }
}

Response 200:
{
  "success": true,
  "actionId": "uuid",
  "timestamp": "2026-04-14T10:00:00Z"
}
```

### Confirmations

#### Approve Action
```
POST /api/confirmations/:confirmationToken
Content-Type: application/json

{
  "confirm": true
}

Response 200:
{
  "success": true,
  "actionId": "uuid"
}
```

#### Reject Action
```
POST /api/confirmations/:confirmationToken
Content-Type: application/json

{
  "confirm": false
}

Response 200:
{
  "success": true,
  "message": "Action cancelled"
}
```

### Health

#### Bridge Health Check
```
GET /health

Response 200:
{
  "status": "ok",
  "timestamp": "2026-04-14T10:00:00Z",
  "uptime": 3600,
  "redis": "connected",
  "controlPlane": "connected"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-04-14T10:00:00Z"
}
```

### Common Error Codes
- `INVALID_TOKEN` - JWT validation failed
- `TENANT_NOT_FOUND` - Tenant does not exist
- `UNAUTHORIZED` - User lacks permission
- `VALIDATION_ERROR` - Request payload invalid
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_SERVICE_ERROR` - Gmail, Sendblue, etc. failed
- `CONFIRMATION_EXPIRED` - Confirmation token timed out
- `INTERNAL_SERVER_ERROR` - Unexpected server error

---

## Rate Limiting

- **Control Plane**: 100 requests/minute per user
- **Bridge**: 1000 webhooks/minute per tenant
- **Response**: `429 Too Many Requests` with `Retry-After` header

---

## Pagination

All list endpoints support pagination:

```
?page=1&pageSize=20
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## OpenTelemetry / Observability

All services emit trace spans:
- `bridge.webhook.receive`
- `bridge.tenant.route`
- `bridge.policy.evaluate`
- `bridge.openclaw.forward`
- `controlplane.action.create`
- `controlplane.instance.provision`

Add to your telemetry collector:
```
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
```
