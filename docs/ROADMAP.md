# Development Roadmap

This is the sequential roadmap for building great-koala from scaffold to production MVP.

## Phase 0: Foundation (Current — Week 1)
**Status**: ✅ Complete — Project scaffold delivered

- [x] Monorepo structure (pnpm workspaces)
- [x] Shared types library
- [x] NestJS control plane scaffold
- [x] Express bridge scaffold
- [x] Next.js dashboard scaffold
- [x] PostgreSQL schema (schema.sql)
- [x] Docker setup (docker-compose, Dockerfiles)
- [x] Environment templates
- [x] Architecture documentation
- [x] API reference documentation
- [x] Development guide

**Deliverable**: Runnable monorepo with zero features (but all plumbing)

**Commands to verify**:
```bash
pnpm install
make infra-up
make db-init
pnpm dev
```

---

## Phase 1: Authentication (Weeks 2–3)
**Goal**: User signup/login, JWT auth, protected routes

**Tasks**:

1. **Clerk/Auth0 Integration** (control-plane)
   - Environment setup in .env
   - Middleware for JWT verification
   - User creation/update on auth callback
   - Role-based access control (RBAC)

2. **Auth Module** (control-plane)
   - `src/modules/auth/auth.service.ts` — token management ✅
   - `src/modules/auth/auth.controller.ts` — login endpoint ✅
   - `src/modules/auth/jwt.strategy.ts` — Passport strategy ✅
   - `src/modules/auth/guards/` — JWT guard ✅

3. **Dashboard Auth** (dashboard)
   - Clerk/Auth0 React integration
   - Login page
   - Protected routes
   - Session management

4. **Bridge Auth** (bridge)
   - Webhook signature verification (HMAC) ✅
   - Service token validation

**Tests**:
- [ ] User can sign up
- [ ] User can log in
- [ ] JWT token issued
- [ ] Protected endpoints reject unauthenticated requests
- [ ] Token refresh works

**Acceptance Criteria**: Login form on dashboard → authenticated user → JWT in localStorage

---

## Phase 2: Tenant Management (Weeks 4–5)
**Goal**: Users can create workspaces (tenants), which provision OpenClaw instances

**Tasks**:

1. **Tenants Module** (control-plane)
   - `src/modules/tenants/tenants.service.ts` — CRUD ✅
   - `src/modules/tenants/tenants.controller.ts` — API endpoints ✅
   - `src/modules/tenants/tenant.entity.ts` — TypeORM entity ✅
   - Tenant creation triggers instance provisioning ✅

2. **Instances Module** (control-plane)
   - `src/modules/instances/instances.service.ts` — provisioning logic ✅
   - `src/modules/instances/provisioner.ts` — VPS provisioning (mock or real SSH)
   - Docker image pulling and starting
   - Health check endpoint setup
   - Subdomain registration (mock)

3. **Dashboard Tenant UI** (dashboard)
   - Create workspace form
   - List workspaces
   - Select active workspace
   - Workspace settings page

4. **Database Setup**
   - Migrations for users, tenants, tenant_instances, routing_identities

**Tests**:
- [ ] User can create tenant
- [ ] Tenant record appears in database
- [ ] Instance provisioning begins
- [ ] Health check endpoint responds
- [ ] Tenant URL is registered

**Acceptance Criteria**: User creates tender → Docker instance starts → Dashboard shows "Healthy"

---

## Phase 3: Sendblue Bridge (Weeks 6–7)
**Goal**: Messages → Bridge → OpenClaw → Response flow working end-to-end

**Tasks**:

1. **Webhook Handler** (bridge)
   - `src/index.ts` — receive webhook ✅
   - Signature verification ✅
   - Event deduplication (Redis) ✅
   - Message parsing ✅

2. **Tenant Router** (bridge)
   - `src/clients/control-plane.client.ts` — map phone/thread → tenant ✅
   - Query routing_identities table ✅
   - Rate limiting per tenant

3. **OpenClaw Client** (bridge)
   - `src/clients/control-plane.client.ts` — HTTP message forwarding ✅
   - Message forwarding ✅
   - Response handling ✅

4. **Sendblue API Client** (bridge)
   - `src/clients/sendblue.client.ts` — send response messages ✅
   - Status tracking
   - Retry logic

5. **Routing Setup** (control-plane)
   - Endpoint to create routing_identities ✅
   - Dashboard page to add phone + thread

**Tests**:
- [x] Bridge receives webhook (mock Sendblue event)
- [x] Bridge routes to correct tenant
- [ ] Bridge forwards to OpenClaw gateway
- [x] OpenClaw response handling in control plane
- [x] Bridge sends response back to user

**Acceptance Criteria**: Send iMessage "hello" → App processes → Sends response back

---

## Phase 4: OAuth Connectors (Weeks 8–9)
**Goal**: Users can authorize Gmail, Google Calendar, Apple Notes

**Tasks**:

1. **Gmail OAuth** (control-plane)
   - `src/modules/connectors/providers/gmail.provider.ts`
   - OAuth callback handler
   - Token storage in AWS Secrets Manager
   - Refresh token logic

2. **Calendar OAuth** (control-plane)
   - Similar to Gmail

3. **Notes OAuth** (control-plane)
   - Apple Notes or alternative

4. **Dashboard Connector UI** (dashboard)
   - Connection status page
   - OAuth redirect buttons
   - Connected account list
   - Disconnect button

5. **Secrets Injection** (control-plane)
   - Pass OAuth tokens to tenant OpenClaw instance as env vars
   - Watch for token refresh

**Progress**:
- [x] Connector module scaffolding and tenant account storage
- [x] Mock Gmail connector route in control plane
- [ ] Full OAuth redirect flow and provider implementations

**Tests**:
- [ ] User clicks "Connect Gmail"
- [ ] Redirected to Google OAuth
- [ ] Callback stores token
- [ ] Token appears in AWS Secrets Manager
- [ ] OpenClaw can access token as env var

**Acceptance Criteria**: User can authorize Gmail → draft email via iMessage

---

## Phase 5: Policy Engine (Weeks 10–11)
**Goal**: Prevent accidental destructive actions with confirmation flow

**Tasks**:

1. **Policy Evaluator** (control-plane)
   - `src/modules/policies/policy.evaluator.ts` ✅
   - Classify action by risk level ✅
   - Default rules: archive = medium, send = high, search = low ✅
   - Custom rule system ✅

2. **Confirmation Flow** (bridge)
   - Generate confirmation token ✅
   - Send approval request iMessage ✅
   - Receive confirmation response ✅
   - Forward to OpenClaw for execution ✅

3. **Confirmation Tokens** (control-plane)
   - Create/validate tokens ✅
   - TTL expiration
   - Track approval/rejection ✅

4. **Action Logging** (control-plane)
   - Store every action_record ✅
   - Record policy decision ✅
   - Track execution status ✅

5. **Dashboard History** (dashboard)
   - Action history page
   - Status filter (pending, executed, failed)
   - Risk level display
   - Execution details view

**Tests**:
- [x] Low-risk action (search) executes immediately
- [x] Medium-risk action (archive) sends confirmation
- [ ] User approves → action executes
- [ ] User rejects → action cancelled
- [ ] Confirmation tokens expire
- [ ] Action appears in history

**Acceptance Criteria**: User sends "archive emails" → receives confirmation iMessage → approves → emails archived and logged

---

## Phase 6: Advanced Connectors (Weeks 12–13)
**Goal**: Full Gmail, Calendar inbox capabilities

**Tasks**:

1. **Gmail Tools** (OpenClaw adapters)
   - `search()` — find emails by filter
   - `read()` — fetch full email
   - `draft()` — create draft
   - `send()` — send email
   - `archive()` — archive email
   - `delete()` — delete email
   - `label()` — add label

2. **Calendar Tools** (OpenClaw adapters)
   - `list()` — show upcoming events
   - `create_event()` — new calendar entry
   - `update_event()` — modify event
   - `find_time()` — free slot finder

3. **Notes Tools** (OpenClaw adapters)
   - `create()` — new note
   - `search()` — find notes
   - `update()` — modify note

4. **Todoist/Linear Integration** (stretching goal)
   - Task management connectors

**Tests**: Each tool endpoint with real integrations (or mocks)

**Acceptance Criteria**: "Schedule lunch with Noah next week" works end-to-end

---

## Phase 7: Dashboard Admin Console (Weeks 14–15)
**Goal**: Operators can manage tenants, view logs, handle billing

**Tasks**:

1. **Admin Dashboard** (dashboard)
   - Tenant list management view
   - Subscription/billing view
   - Instance health dashboard
   - Audit log viewer

2. **Metrics & Observability** (control-plane)
   - OpenTelemetry instrumentation
   - Prometheus metrics export
   - Error rate tracking
   - Message volume graphs

3. **Support Tooling**
   - Impersonate tenant (careful!)
   - Manual action approval
   - Log export

**Tests**: Admin can view all tenants and their actions

**Acceptance Criteria**: Ops dashboard shows system health

---

## Phase 8: Billing & Subscription (Weeks 16–17)
**Goal**: Stripe integration for payments

**Tasks**:

1. **Stripe Integration** (control-plane)
   - `src/modules/billing/stripe.service.ts`
   - Customer creation
   - Subscription handling
   - Usage tracking

2. **Billing Module** (control-plane)
   - Track message count per month
   - Track model token spend
   - Calculate overage fees
   - Suspend overdue tenants

3. **Dashboard Billing UI** (dashboard)
   - Subscription status
   - Current usage
   - Payment method management
   - Invoice history

**Tests**: Create tenant → subscribe → usage tracked → invoice generated

**Acceptance Criteria**: Billing loop works (sign up → charge → track usage)

---

## Phase 9: Production Readiness (Weeks 18–20)
**Goal**: Security, scaling, deployment

**Tasks**:

1. **Security Audit**
   - Secrets management (review AWS access)
   - CORS policies
   - Rate limiting
   - SQL injection prevention (TypeORM mitigation)

2. **Observability**
   - Sentry error tracking
   - Loki log aggregation (optional)
   - Grafana dashboards
   - Trace sampling

3. **Load Testing**
   - Simulate 100 concurrent tenants
   - Webhook throughput limits
   - Database query optimization

4. **Deployment Automation**
   - Terraform for AWS infrastructure
   - Docker image registry (ECR)
   - CI/CD pipeline (GitHub Actions)
   - Blue/green deployment

5. **Ops Documentation**
   - Runbook for incident response
   - Scaling guide
   - Backup/recovery procedure

**Tests**: Chaos engineering (kill services, verify recovery)

**Acceptance Criteria**: System resilient to failures, fully monitored, auto-scalable

---

## Phase 10: MVP Launch (Week 21)
**Goal**: Production deployment

**Tasks**:

1. Use terraform to provision AWS infrastructure
2. Deploy control plane, bridge, dashboard to production
3. Create first paying customer tiers (free, pro, enterprise)
4. Setup support communication channel
5. Monitor closely for first week

**Acceptance Criteria**: 
- At least one paying customer
- <1% error rate
- <500ms average latency
- Zero data breaches

---

## Future Extensions (Not in MVP)

### Tier 2 Features
- Multi-user tenant support (Admin + team members)
- Custom policy builder UI
- Webhook replay functionality
- Advanced search across all actions
- Email digest summaries
- Slack integration
- API for third-party systems

### Tier 3 Features
- Local/self-hosted model deployment
- Voice interface (phone call)
- Video action confirmation (biometric)
- Advanced RAG (document indexing)
- Scheduled actions ("Daily digest")
- Team collaboration features

### Infrastructure
- Kubernetes migration (when >100 tenants)
- Multi-region deployment
- High-availability database setup
- GraphQL API layer
- SDK for third-party integrations

---

## Timeline Summary

| Phase | Weeks | Focus |
|-------|-------|-------|
| 0 | 1 | Foundation ✅ |
| 1 | 2 | Auth |
| 2 | 2 | Tenants + Provisioning |
| 3 | 2 | Webhook Bridge |
| 4 | 2 | OAuth Connectors |
| 5 | 2 | Policy Engine |
| 6 | 2 | Gmail/Calendar Tools |
| 7 | 2 | Admin Dashboard |
| 8 | 2 | Billing |
| 9 | 3 | Production Hardening |
| 10 | 1 | Launch |
| **Total** | **21** | **From scaffold to MVP** |

With one full-time engineer: **5–6 months**
With two engineers: **3–4 months**

---

## Success Metrics

### By end of MVP
- ✅ System handles 10k+ iMessages/day
- ✅ <5% error rate
- ✅ <2 second average response time
- ✅ 100% audit trail coverage
- ✅ Zero unplanned outages
- ✅ First 10 paying customers

### By Month 6
- ✅ 100+ customers
- ✅ <1% error rate
- ✅ Multi-tenant scaling validated
- ✅ Annual recurring revenue $XXk

---

## Getting Help

- Stuck on auth? Check `packages/control-plane/src/modules/auth/auth.module.ts` scaffold
- Database issues? See `infra/schema.sql` and postgres logs
- Bridge routing? See test data in `docs/DEVELOPMENT.md`
- Architecture questions? Re-read `docs/ARCHITECTURE.md`

Good luck! 🚀
