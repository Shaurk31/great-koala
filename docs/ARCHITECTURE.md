# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        User (iMessage)                  │
└────────────────────┬──────────────────────────────────┘
                     │
                Sendblue Webhooks
                     │
┌────────────────────▼──────────────────────────────────┐
│              Bridge Service (Regional)                │
│  - Webhook ingestion & signature verification        │
│  - Event deduplication (Redis)                        │
│  - Tenant routing by phone + thread                   │
│  - Policy evaluation                                  │
│  - Sendblue API response sending                      │
└────────────────────┬──────────────────────────────────┘
                     │ (HTTP/WebSocket)
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐ ┌─────────┐  ┌─────────┐
   │Tenant A │ │Tenant B │  │Tenant N │
   │         │ │         │  │         │
   │OpenClaw │ │OpenClaw │  │OpenClaw │
   │Gateway  │ │Gateway  │  │Gateway  │
   │(VPS1)   │ │(VPS2)   │  │(VPSN)   │
   └────┬────┘ └────┬────┘  └────┬────┘
        │ Gmail     │             │
        │ Calendar  │ Notes       │
        │ Tasks     │             │
        └───────────┴─────────────┘
              │
        (API calls to services)

┌────────────────────────────────────────────────────────┐
│        Control Plane (AWS ECS/Fargate)                 │
│  - User & tenant management                           │
│  - Instance provisioning (Docker on VPS)              │
│  - OAuth connection setup                             │
│  - Secrets management (AWS Secrets Manager)           │
│  - Billing (Stripe integration)                       │
│  - Dashboard & admin console                          │
│  - Audit logs & usage metrics                         │
│                                                        │
│  Data Storage:                                         │
│  - Postgres (users, tenants, routing, policies)       │
│  - Redis (jobs, cache, dedup)                         │
│  - AWS Secrets Manager (OAuth tokens, API keys)       │
└────────────────────────────────────────────────────────┘
```

## Request Flow: Archive Emails Example

1. **User sends iMessage**: "archive recruiter emails older than 2 weeks"

2. **Sendblue delivers webhook** to bridge's `/webhooks/sendblue`
   - Payload includes: sender phone, thread ID, message text

3. **Bridge processes webhook**:
   - Verify webhook signature
   - Deduplicate (check Redis for duplicate message_id)
   - Look up routing identity: phone → tenant → OpenClaw URL
   - Normalize into MessageEvent type

4. **Bridge forwards to tenant's OpenClaw gateway**
   - HTTP POST to `https://tenant-a.greatkoala.com/api/message`
   - Payload: `{ tenantId, text, sender, threadId }`

5. **OpenClaw processes**:
   - Parse user intent (archive emails)
   - Determine it needs Gmail connector
   - Call tool: `gmail.search()` with filter
   - Finds 18 matching emails

6. **Policy evaluation**:
   - Action: delete/archive = "medium risk"
   - Default policy: requires in-thread confirmation
   - OpenClaw returns confirmation request

7. **Bridge sends confirmation back**:
   - Create confirmation token in DB
   - Send iMessage: "Found 18 recruiter emails. Archive them?"
   - Token maps to action_record_id for idempotency

8. **User replies "yes"**:
   - Sendblue delivers second webhook
   - Bridge has token, knows this is action confirmation
   - Bridge calls `/confirmations/{token}` endpoint
   - Creates action record with status `executing`

9. **OpenClaw executes**:
   - Calls `gmail.archive()` with email IDs
   - Records tool_execution with result

10. **Bridge sends success**:
    - iMessage: "Done — archived 18 emails"
    - Action record marked `executed`
    - Audit log entry created

## Component Responsibilities

### Bridge Service
- **Sendblue webhook HTTP endpoint** — receive inbound messages
- **Signature verification** — verify webhook authenticity
- **Deduplication** — prevent duplicate processing (Redis)
- **Tenant routing** — map sender + thread → tenant + OpenClaw URL
- **Message normalization** — convert Sendblue payload to MessageEvent
- **Tenant RPC client** — HTTP/WebSocket to OpenClaw gateway
- **Policy enforcement** — control what actions auto-execute vs confirm
- **Confirmation flow** — handle user approval/rejection
- **Sendblue send wrapper** — call Sendblue API to send responses
- **Error recovery** — retry logic for failed calls
- **Observability** — structured logging, traces, metrics

### OpenClaw Gateway (per-tenant)
- **Message interpretation** — understand user intent
- **Session/memory management** — maintain conversation context
- **Tool orchestration** — decide which connectors to invoke
- **Model interaction** — call LLM for reasoning
- **Response generation** — create assistant reply or action plan
- **Connector execution** — call Gmail, Calendar, Notes, etc.
- **Error handling** — graceful failures
- **NOT responsible for**: Security boundaries, tenant isolation (that's the bridge), confirmation gating, audit

### Control Plane
- **User authentication** — Clerk/Auth0 integration
- **Tenant provisioning** — create database records
- **Instance orchestration** — provision OpenClaw Docker containers
- **Secret management** — store OAuth tokens in AWS Secrets Manager
- **OAuth flows** — handle Gmail, Calendar OAuth callbacks
- **Billing** — Stripe integration, usage tracking
- **Dashboard** — Next.js frontend for users
- **Admin console** — operator tools
- **Audit trail** — log all state changes
- **Health monitoring** — instance heartbeats, alerting

## Isolation Model

### Trust Boundaries
- **Tenant A ≠ Tenant B**: completely isolated runtimes, storage, logs
- **Outside user** ≠ **tenant's authorized numbers**: message rejection
- **High-risk action** ≠ **auto-execute**: policy gate required

### Implementation
- One OpenClaw gateway per tenant (not shared)
- One Postgres schema per tenant (or RBAC at query layer)
- One set of secrets per tenant (AWS Secrets Manager per customer ID)
- One DM session per sender (prevent cross-contamination)
- One operational log per tenant (not shared logs)

## Scaling Considerations

### Control Plane (AWS ECS/Lambda-based)
- Horizontal scaling: multi-region dashboards, APIs behind ALB
- Database: RDS with read replicas
- Cache: ElastiCache cluster
- Jobs: BullMQ workers in containers

### Runtime Plane (VPS or microVMs per tenant)
- Hetzner/DigitalOcean: SSH provisioning script
- Later: Nomad or Fly.io for denser packing
- Instance fleet monitoring via control plane health checks
- Failover: DNS switch or container restart on same host

### Bridge Service
- Single regional instance (central hub for webhooks)
- Horizontally scalable: multiple replicas behind load balancer
- Redis for coordination between instances

## Deployment Path

### Day 1 (MVP)
- Control plane on ECS Fargate
- Bridge on single ECS container
- Dashboard on Vercel or ECS
- Postgres on RDS micro
- Redis on ElastiCache
- One tenant on Hetzner VPS for manual testing

### Month 1–2
- Automate tenant provisioning (control plane → Docker SSH)
- Health monitoring and alerting
- Multi-provider model support
- Basic usage tracking & billing

### Month 3+
- Infrastructure as Code (Terraform)
- Kubernetes or Nomad for runtimes
- Multi-region fallback
- Advanced policy builder UI
