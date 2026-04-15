.PHONY: help install dev build test lint format clean db db-reset db-seed infra-up infra-down logs

help:
	@echo "great-koala development commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install        Install dependencies"
	@echo "  make env            Copy .env.example to .env"
	@echo ""
	@echo "Development:"
	@echo "  make dev            Start all services"
	@echo "  make build          Build all packages"
	@echo "  make test           Run all tests"
	@echo "  make lint           Lint all code"
	@echo "  make format         Format all code"
	@echo ""
	@echo "Database:"
	@echo "  make infra-up       Start Postgres & Redis (Docker)"
	@echo "  make infra-down     Stop infrastructure"
	@echo "  make db-init        Load schema into database"
	@echo "  make db-reset       Drop and recreate database"
	@echo "  make db-seed        Load test data (TODO)"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          Remove build artifacts"
	@echo "  make logs           Show infrastructure logs"
	@echo ""

install:
	pnpm install

env:
	@test -f .env || cp .env.example .env
	@echo "✓ .env created (edit as needed)"

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

format:
	pnpm format

clean:
	rm -rf packages/*/dist
	rm -rf packages/*/node_modules
	pnpm store prune

infra-up:
	docker compose -f infra/docker/docker-compose.yml up -d
	@echo "✓ Postgres running on localhost:5432"
	@echo "✓ Redis running on localhost:6379"

infra-down:
	docker compose -f infra/docker/docker-compose.yml down

logs:
	docker compose -f infra/docker/docker-compose.yml logs -f

db-init: env
	@echo "Loading database schema..."
	@PGPASSWORD=dev-password psql -h localhost -U postgres -d great-koala < infra/schema.sql
	@echo "✓ Schema loaded"

db-reset: env
	@echo "Dropping and recreating database..."
	@PGPASSWORD=dev-password psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS \"great-koala\";"
	@PGPASSWORD=dev-password psql -h localhost -U postgres -c "CREATE DATABASE \"great-koala\";"
	@echo "✓ Database reset"

db-seed:
	@echo "TODO: Implement db-seed"

# Quick start
quick-start: install env infra-up db-init
	@echo ""
	@echo "✓ Setup complete!"
	@echo ""
	@echo "Next: pnpm dev"
	@echo ""

# Docker builds
docker-build-cp:
	docker build -f infra/docker/Dockerfile.control-plane -t great-koala/control-plane:latest .

docker-build-bridge:
	docker build -f infra/docker/Dockerfile.bridge -t great-koala/bridge:latest .

docker-build-all: docker-build-cp docker-build-bridge
	@echo "✓ Docker images built"

# Health checks
health:
	@curl -s http://localhost:3001/health | jq . || echo "Control plane offline"
	@curl -s http://localhost:3002/health | jq . || echo "Bridge offline"
	@curl -s http://localhost:3000 > /dev/null && echo "Dashboard online" || echo "Dashboard offline"

# Individual service dev
dev-cp:
	cd packages/control-plane && pnpm dev

dev-bridge:
	cd packages/bridge && pnpm dev

dev-dashboard:
	cd packages/dashboard && pnpm dev

# Type checking
type-check:
	pnpm type-check
