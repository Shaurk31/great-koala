## Getting Started

Welcome to **great-koala**, the platform for building a text-your-work OS powered by per-user OpenClaw runtimes.

This is the full scaffold for a production-grade SaaS platform. Here's what you have:

### What's Included

✅ **Monorepo structure** (packages/shared, packages/control-plane, packages/bridge, packages/dashboard)
✅ **Database schema** (PostgreSQL with 14+ core tables)
✅ **Docker setup** (Dockerfiles, docker-compose for local dev)
✅ **NestJS backend scaffold** (with placeholder modules)
✅ **Next.js dashboard scaffold** (pages, styling, auth hooks)
✅ **Bridge service scaffold** (Express, Sendblue webhook handler)
✅ **Type definitions** (shared contracts, API types, database models)
✅ **Environment templates** (.env.example)
✅ **Architecture documentation** (ARCHITECTURE.md, API.md, DEVELOPMENT.md)

### Next Steps (Priority Order)

#### 1. Install & Run (5 minutes)
```bash
pnpm install
cp .env.example .env
docker-compose -f infra/docker/docker-compose.yml up -d
pnpm dev
```

Visit:
- Dashboard: http://localhost:3000
- Control Plane Docs: http://localhost:3001
- Bridge: http://localhost:3002

#### 2. Understand the Architecture (10 minutes)
Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand:
- How webhooks flow from Sendblue to tenant OpenClaw runtimes
- Where policy enforcement happens
- How isolation is maintained

#### 3. Read API Design (5 minutes)
Check [API.md](docs/API.md) for the contract between:
- Control plane & bridge
- Bridge & tenant runtimes
- Auth & connector flows

#### 4. Start Building Modules (iterative)

**First module to build**: Auth integration (Clerk or Auth0)
- File: `packages/control-plane/src/modules/auth/`
- Task: Implement JWT service, protect endpoints
- Result: `/api/auth/login` endpoint + middleware

**Second module**: Tenants CRUD
- File: `packages/control-plane/src/modules/tenants/`
- Task: Implement create/read/update/delete endpoints
- Result: Tenant provisioning initiated

**Third module**: Instance provisioning
- File: `packages/control-plane/src/modules/instances/`
- Task: SSH to VPS, deploy Docker OpenClaw image
- Result: Per-tenant gateway running and health-checked

**Fourth module**: Bridge webhook handler
- File: `packages/bridge/src/handlers/`
- Task: Receive Sendblue message, route to tenant, send response
- Result: End-to-end message flow working

**Fifth module**: Policies
- File: `packages/control-plane/src/modules/policies/`
- Task: Implement risk classification, confirmation flow
- Result: High-risk actions require user approval

**Sixth module**: Dashboard pages
- File: `packages/dashboard/src/pages/`
- Task: Build connection flow, action history, settings
- Result: User-facing product interface

### Key Files to Review

| File | Purpose |
|------|---------|
| `packages/shared/src/types.ts` | Message & OpenClaw contracts (foundational) |
| `packages/control-plane/src/app.module.ts` | NestJS setup and module imports |
| `packages/bridge/src/index.ts` | Express app with webhook endpoint |
| `packages/dashboard/src/pages/index.tsx` | Dashboard home (example Next.js page) |
| `infra/schema.sql` | Database schema |
| `docs/ARCHITECTURE.md` | Full system design |

### Common Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm build                  # Build all packages
pnpm format                 # Format code with Prettier

# Database
docker-compose -f infra/docker/docker-compose.yml up -d  # Start Postgres + Redis
psql -h localhost -U postgres -d great-koala             # Connect to Postgres

# Individual service development
cd packages/control-plane && pnpm dev
cd packages/bridge && pnpm dev
cd packages/dashboard && pnpm dev
```

### Environment Setup

Copy `.env.example` to `.env` and fill in:

**Essential (local dev works without these, but you'll need them for features to work):**
- `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` — auth
- `SENDBLUE_API_KEY` — messaging
- `OPENAI_API_KEY` — model provider
- `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` — Gmail OAuth

**Infrastructure (provided by docker-compose):**
- `DB_HOST`, `REDIS_HOST` — localhost
- `DB_PASSWORD` — dev-password

### Understanding the System

```
User (iMessage)
    ↓ [Sendblue]
Bridge Service ← receives webhook, routes to tenant
    ↓ [HTTP/WS]
Tenant's OpenClaw Gateway ← interprets intent, calls tools
    ↓ [OAuth tokens]
Gmail, Calendar, Notes ← executes actions
    ↑
Policy Engine ← gates high-risk actions
```

Every tenant gets their own OpenClaw instance because:
1. **Security**: Isolated memory, logs, secrets
2. **Compliance**: Each customer's data stays separate
3. **Reliability**: One customer's issue doesn't affect others

### Architecture Decision: Why This Stack?

- **NestJS**: Strong TypeScript, dependency injection, great for team handoff
- **PostgreSQL**: Relational integrity (routing, audit trails)
- **Redis**: Deduplication, job queue, caching
- **OpenClaw**: Proven LLM gateway, session-aware, tool orchestration
- **Sendblue**: iMessage API (no need to build SMS yourself)
- **Per-tenant VPS**: Simplest isolation model (Docker SSH provisioning)
- **AWS/Vercel**: Proven infrastructure for SaaS control plane

### Operational Assumptions

1. **One gateway per customer** — always. Never share.
2. **Confirmation for risky actions** — policy engine gates everything.
3. **Audit everything** — legal, compliance, debugging.
4. **Per-sender isolation** — DM context doesn't leak between senders.
5. **Secrets in manager** — never in Postgres.

### What's NOT Here (Yet)

- ❌ Kubernetes manifests (added when you have 100s of tenants)
- ❌ Terraform automation (but infra/terraform/ folder is ready)
- ❌ Advanced telemetry (but OpenTelemetry hooks are ready)
- ❌ Multi-region failover (start in one region)
- ❌ Rate limiting (but Redis is ready)
- ❌ Notification system (can be added to bridge)

### Checkpoint: What Should Work Now

After setup:

✅ Pnpm workspaces configured
✅ Database schema loadable
✅ Services can start without errors
✅ Types compile cleanly
✅ Docker images buildable
✅ .env file recognized

If any of these fail → check [DEVELOPMENT.md](docs/DEVELOPMENT.md) troubleshooting.

### Next Phase: MVP Feature Set

To launch an MVP, you need:

1. **Auth**: User signup/login (Clerk)
2. **Tenants**: Create workspace (provision OpenClaw)
3. **Connectors**: Connect Gmail (OAuth flow)
4. **Bridge**: Receive iMessage → forward to OpenClaw → send response
5. **Actions**: Archive emails (policy check → confirm → execute)
6. **Dashboard**: View action history, connect accounts

This can be done in ~4–6 weeks with 1–2 engineers.

### Questions?

- System design: See `docs/ARCHITECTURE.md`
- API contracts: See `docs/API.md`
- How to extend: See `docs/DEVELOPMENT.md`
- Database schema: See `infra/schema.sql`

Good luck! 🚀
