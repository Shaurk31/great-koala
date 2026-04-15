# Development Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker (for local infrastructure)
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd great-koala
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
# Start Postgres and Redis
docker-compose -f infra/docker/docker-compose.yml up -d

# Run database migrations (if available)
# TODO: Setup migration tooling
```

### 4. Start Development Servers

```bash
# Terminal 1: Run all services in parallel
pnpm dev

# Or run individually:
# Terminal 1: Control plane
cd packages/control-plane && pnpm dev

# Terminal 2: Bridge
cd packages/bridge && pnpm dev

# Terminal 3: Dashboard
cd packages/dashboard && pnpm dev
```

Services will run on:
- **Dashboard**: http://localhost:3000
- **Control Plane**: http://localhost:3001
- **Bridge**: http://localhost:3002
- **Postgres**: localhost:5432
- **Redis**: localhost:6379

## Project Structure

### packages/shared
Shared TypeScript types and contracts used across services.

**Key files:**
- `src/types.ts` — Message types, OpenClaw contracts
- `src/database.ts` — TypeORM entity definitions
- `src/api.ts` — API response shapes

**Development:**
```bash
cd packages/shared
pnpm build  # Compile TypeScript
pnpm dev    # Watch mode
```

### packages/control-plane
NestJS backend for tenant orchestration and provisioning.

**Key modules:**
- `modules/auth` — User authentication
- `modules/tenants` — Tenant CRUD
- `modules/instances` — OpenClaw provisioning
- `modules/connectors` — OAuth integrations
- `modules/policies` — Risk classification
- `modules/actions` — Action history

**Development:**
```bash
cd packages/control-plane
pnpm dev    # Watch mode with auto-reload
pnpm test   # Run tests
pnpm lint   # ESLint
```

**Database:**
- Entities are auto-loaded from modules
- Postgres connection string from `.env`
- Sync mode enabled in dev (auto-create tables)

### packages/bridge
Node/Express webhook bridge for Sendblue.

**Key files:**
- `src/index.ts` — Express app setup
- `src/handlers/` — Webhook handlers (TODO)
- `src/connectors/` — Sendblue API client (TODO)
- `src/policy/` — Policy evaluation (TODO)
- `src/lib/logger.ts` — Winston logger

**Development:**
```bash
cd packages/bridge
pnpm dev    # Watch mode with tsx
pnpm test   # Run tests
```

### packages/dashboard
Next.js frontend for user dashboard.

**Key files:**
- `src/pages/index.tsx` — Dashboard home
- `src/pages/connections.tsx` — OAuth setup
- `src/pages/actions.tsx` — Action history
- `src/lib/` — API clients (TODO)
- `src/components/` — Reusable components (TODO)

**Development:**
```bash
cd packages/dashboard
pnpm dev    # Next.js dev server with HMR
pnpm build  # Production build
```

## Database Development

### Schema

Schema is defined in `infra/schema.sql`.

To load the schema:
```bash
PGPASSWORD=dev-password psql -h localhost -U postgres -d great-koala < infra/schema.sql
```

### TypeORM Entities

Entities are defined in control-plane and will auto-sync if `synchronize: true` (dev only).

To create a migration:
```bash
# TODO: Setup migration commands
cd packages/control-plane
npx typeorm migration:create src/migrations/CreateUserTable
npx typeorm migration:run
```

### Seed Data

```bash
# TODO: Create seed script
pnpm db:seed
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode (single package)
cd packages/bridge && pnpm test:watch

# Coverage
cd packages/control-plane && pnpm test:cov
```

## Building for Production

```bash
# Build all packages
pnpm build

# Or individually
cd packages/control-plane && pnpm build
cd packages/bridge && pnpm build
cd packages/dashboard && pnpm build
```

## Docker Build

```bash
# Control plane
docker build -f infra/docker/Dockerfile.control-plane -t great-koala/control-plane .

# Bridge
docker build -f infra/docker/Dockerfile.bridge -t great-koala/bridge .

# Dashboard
# TODO: Add Dockerfile.dashboard
```

## Code Quality

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Type check all packages
pnpm type-check
```

## Debugging

### Control Plane

Enable Node debugger:
```bash
NODE_OPTIONS='--inspect' node dist/main.js
```

Visit: `chrome://inspect`

### Bridge

```bash
DEBUG=* pnpm dev
```

### Adding New Modules (Control Plane)

1. Create module directory under `src/modules/feature`
2. Create `.module.ts` file implementing NestJS module
3. Add to `app.module.ts` imports
4. Create entities in the module directory
5. Create services/controllers

Example:
```typescript
// src/modules/example/example.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExampleService } from './example.service';
import { ExampleController } from './example.controller';
import { ExampleEntity } from './example.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExampleEntity])],
  providers: [ExampleService],
  controllers: [ExampleController],
  exports: [ExampleService],
})
export class ExampleModule {}
```

## Environment Variables

### Control Plane
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `REDIS_HOST`, `REDIS_PORT`
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`
- `PORT`, `NODE_ENV`, `LOG_LEVEL`

### Bridge
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `REDIS_HOST`, `REDIS_PORT`
- `SENDBLUE_API_KEY`, `SENDBLUE_WEBHOOK_SECRET`
- `CONTROL_PLANE_URL`
- `PORT`, `NODE_ENV`, `LOG_LEVEL`

### Dashboard
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Common Tasks

### Add a New API Endpoint

1. Define types in `packages/shared/src/api.ts`
2. Create DTO in control-plane
3. Implement service method
4. Add controller route
5. Test with curl/Postman

### Add OAuth Integration

1. Register app with provider (Gmail, Calendar, etc.)
2. Create `src/modules/connectors/providers/gmail.provider.ts`
3. Implement OAuth flow
4. Add token storage in secrets manager
5. Create dashboard connection UI

### Deploy Tenant Instance

1. Control plane calls provisioning service
2. Provision service SSHs to VPS
3. Pulls OpenClaw Docker image
4. Starts container with:
   - Mounted persistent volume
   - Environment variables (model API key, etc.)
   - Health check endpoint
5. Registers subdomain/port in routing table
6. Returns instance URL to control plane

## Troubleshooting

### Postgres Connection Error
```bash
docker-compose -f infra/docker/docker-compose.yml logs postgres
```

### Redis Not Found
```bash
# Check Redis is running
redis-cli ping  # Should return PONG
```

### TypeORM Entity Not Recognized
- Ensure entity file ends with `.entity.ts`
- Ensure module imports `TypeOrmModule.forFeature([...])`
- Check `autoLoadEntities: true` in AppModule

### pnpm Workspace Issues
```bash
pnpm install --no-frozen-lockfile
pnpm store prune
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [API.md](./API.md) — API reference
- [DATABASE.md](./DATABASE.md) — Data model (TODO)
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment (TODO)
- [SECURITY.md](./SECURITY.md) — Security considerations (TODO)

## Performance Monitoring

Enable telemetry:
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 pnpm dev
```

View traces in Jaeger: http://localhost:16686

## Contributing

1. Create feature branch: `git checkout -b feat/awesome-feature`
2. Make changes and test
3. Run lint and type-check
4. Commit with descriptive message
5. Push and create PR

Code style: Prettier + ESLint

## Next Steps

Recommended order for development:

1. ✅ Project scaffold (done)
2. Setup database & migrations
3. Implement auth module (Clerk integration)
4. Implement tenants + instances modules
5. Build bridge webhook handler
6. Implement policies module
7. Build dashboard UI
8. Add connector modules (Gmail, Calendar, etc.)
9. Setup observability
10. Prepare for production deployment
