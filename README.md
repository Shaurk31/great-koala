# great-koala

Text-your-work OS: A hosted, per-user OpenClaw gateway platform with iMessage messaging ingress, policy-enforced action execution, and app connectors.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User (iMessage)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    (Sendblue)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                 Bridge Service (Webhook)                        │
│          - Verify & dedupe Sendblue events                      │
│          - Map sender/thread to tenant                          │
│          - Forward to tenant OpenClaw gateway                   │
│          - Apply policy rules                                   │
│          - Send response back via Sendblue                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐   ┌─────────┐    ┌─────────┐
   │Tenant 1 │   │Tenant 2 │    │Tenant N │
   │OpenClaw │   │OpenClaw │    │OpenClaw │
   │Gateway  │   │Gateway  │    │Gateway  │
   └────┬────┘   └────┬────┘    └────┬────┘
        │ Gmail        │             │
        │ Calendar     │ Notes       │
        │ Tasks        │             │
        └──────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Control Plane (SaaS)                               │
│     - Tenant provisioning & orchestration                       │
│     - Auth & billing                                            │
│     - Dashboard & logs                                          │
│     - Secrets & OAuth management                                │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
great-koala/
├── packages/
│   ├── shared/              # Shared types and contracts
│   ├── control-plane/       # NestJS backend API
│   ├── dashboard/           # Next.js frontend
│   └── bridge/              # Sendblue webhook bridge
├── infra/                   # Infrastructure & deployment
│   ├── docker/              # Dockerfiles
│   ├── terraform/           # IaC (AWS)
│   └── k8s/                 # Kubernetes manifests
├── docs/                    # Architecture & API docs
└── README.md
```

## Packages

### `@great-koala/shared`
Shared types, contracts, and utilities used across services.

- Message event types
- API response contracts
- Action logging schemas
- Policy rule definitions

### `@great-koala/control-plane`
NestJS backend for tenant & infrastructure management.

**Responsibilities:**
- User signup & authentication (Clerk/Auth0)
- Tenant provisioning (creates OpenClaw gateway instances)
- Secret management (AWS Secrets Manager)
- OAuth setup (Gmail, Google Calendar, etc.)
- Billing (Stripe)
- Audit logs & action history
- Health checks and monitoring

**Key modules:**
- `auth` - User authentication
- `tenants` - Tenant lifecycle management
- `instances` - OpenClaw gateway provisioning
- `routing` - Phone/thread identity mapping
- `connectors` - App integration setup
- `policies` - Risk-based action policies
- `actions` - Action history & audit

### `@great-koala/dashboard`
Next.js frontend for users and operators.

**Features:**
- Dashboard login (OAuth)
- Account connections (Gmail, Calendar, Notes, Tasks)
- Action history & logs
- Pending confirmations
- Settings & permissions
- Admin operator console

### `@great-koala/bridge`
Node/TypeScript service for Sendblue webhook handling.

**Responsibilities:**
- Receive Sendblue webhooks
- Route to correct tenant OpenClaw gateway
- Deduplicate events
- Apply policy rules
- Execute confirmations
- Send responses via Sendblue API

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker (for per-user OpenClaw runtimes)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Run dev servers
pnpm dev
```

### Database Setup

```bash
# Create Postgres database
createdb great-koala

# Run migrations (coming soon)
pnpm db:migrate
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, TypeScript, TailwindCSS |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| Cache/Jobs | Redis, BullMQ |
| Messaging | Sendblue |
| Per-tenant Runtime | OpenClaw (Docker) |
| Secrets | AWS Secrets Manager |
| Auth | Clerk/Auth0 |
| Billing | Stripe |
| Observability | OpenTelemetry, Prometheus, Sentry |
| Deployment | Docker, AWS (control plane), Hetzner/VPS (runtimes) |

## Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check

# Format code
pnpm format
```

## Deployment

Control plane runs on AWS (ECS Fargate). Per-user runtimes run on Hetzner VPS or similar lightweight VMs.

See [infra/](./infra) for Docker and Terraform configurations.

## Data Model

Core Postgres tables:
- `users` - Platform users
- `tenants` - Customer accounts
- `tenant_instances` - OpenClaw gateway deployments
- `routing_identities` - Phone/thread mappings
- `third_party_accounts` - OAuth connections
- `secret_refs` - References to secrets in AWS Secrets Manager
- `message_events` - Inbound iMessage events
- `assistant_runs` - OpenClaw session logs
- `action_records` - Action audit trail
- `confirmation_tokens` - Pending confirmations
- `usage_records` - Billing metrics

## Security

- **Isolation**: One OpenClaw gateway per customer with isolated storage, secrets, and logs
- **Policy Engine**: Risk-based action classification (low/medium/high) with confirmation flow
- **Authentication**: Clerk/Auth0 for dashboard + OAuth for app connectors
- **Secrets**: AWS Secrets Manager (never store raw tokens in Postgres)
- **Audit**: Complete action trail with intent, operations, status, and requester
- **Sender Isolation**: Per-sender DM context separation to prevent cross-conversation leaks

## License

Private

## Support

For questions, see [docs/](./docs) or contact the team.
