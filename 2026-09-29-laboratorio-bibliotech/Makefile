SHELL := /bin/bash

COMPOSE_DEV := docker compose -f compose.yaml -f compose.dev.yaml --env-file .env.dev
COMPOSE_PROD := docker compose -f compose.yaml -f compose.prod.yaml --env-file .env.prod

.PHONY: init dev dev-detached down logs ps adminer test test-backend test-frontend test-e2e \
	prod-check prod prod-migrate prod-seed-admin prod-down prod-logs

init:
	@./scripts/init-env.sh

dev: init
	$(COMPOSE_DEV) up --build

dev-detached: init
	$(COMPOSE_DEV) up --build -d

down:
	$(COMPOSE_DEV) down

logs:
	$(COMPOSE_DEV) logs -f

ps:
	$(COMPOSE_DEV) ps

adminer:
	@echo "Adminer: http://localhost:8081 (servidor: db, usuario: $$(grep '^DB_USER=' .env.dev | cut -d= -f2))"

test: test-backend test-frontend

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

test-e2e: init
	$(COMPOSE_DEV) up -d db
	cd backend && npm run test:e2e

prod-check:
	@test -f .env.prod || (echo "Falta .env.prod. Copiá .env.prod.example y completá los secretos." && exit 1)
	@grep -Eq '^JWT_SECRET=.{32,}' .env.prod || (echo "JWT_SECRET debe tener al menos 32 caracteres." && exit 1)
	@grep -Eq '^DB_PASSWORD=.{8,}' .env.prod || (echo "DB_PASSWORD es obligatorio." && exit 1)
	@grep -Eq '^DB_ROOT_PASSWORD=.{8,}' .env.prod || (echo "DB_ROOT_PASSWORD es obligatorio." && exit 1)
	@grep -Eq '^ADMIN_EMAIL=.+@.+' .env.prod || (echo "ADMIN_EMAIL es obligatorio." && exit 1)
	@grep -Eq '^ADMIN_PASSWORD=.{8,}' .env.prod || (echo "ADMIN_PASSWORD es obligatorio." && exit 1)

prod-migrate: prod-check
	$(COMPOSE_PROD) run --rm backend node dist/infrastructure/persistence/migrate.js

prod-seed-admin: prod-check
	$(COMPOSE_PROD) run --rm backend node dist/infrastructure/persistence/seed-admin.js

prod: prod-check
	$(COMPOSE_PROD) up --build -d

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f
