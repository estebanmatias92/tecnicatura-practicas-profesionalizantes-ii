# BiblioTech — interfaz unificada de tooling (make).
# Convencion: practico-01/Makefile (.DEFAULT_GOAL help, .PHONY, ayuda auto).
#
# Variables de invocacion (override por CLI, nunca editar el archivo):
#   ARGS="..."            flags extra para compose up/logs (ej: make dev ARGS="-d").
#                          OJO: `make dev -d` NO sirve (-d es debug de make).
#   CONFIRM=yes           requerido por destroy (borra DB y uploads).
#   EMAIL= / PASSWORD=    para seed-admin y token (password >= 8, BR-003).
#                          Evitar $ " ` \ en PASSWORD, o pre-exportar SEED_PASSWORD.
#   JWT=                  token Professor/Admin para perf (se obtiene con make token).
#   API_URL=              base del API (default http://localhost:3000).
#   FILE=                 fixture 50MB para perf-upload (default /tmp/fixtures/big-50mb.pdf).
.DEFAULT_GOAL := help

COMPOSE := docker compose
COMPOSE_DEV := $(COMPOSE) -f docker-compose.yaml -f docker-compose.dev.yaml
BACKEND := backend
FRONTEND := frontend
SECRET_PLACEHOLDER := cambiar-por-secreto-largo-aleatorio
API_URL_DEFAULT := http://localhost:3000
UPLOAD_FIXTURE := /tmp/fixtures/big-50mb.pdf

PUML := docs/02-requirements/conceptual-model.puml \
	docs/02-requirements/context.puml \
	docs/03-architecture/c4-context.puml \
	docs/03-architecture/c4-container.puml \
	docs/03-architecture/class-diagram.puml \
	docs/03-architecture/data-model-er.puml \
	docs/03-architecture/sequence-diagram-UC-001.puml \
	docs/03-architecture/sequence-diagram-UC-002.puml \
	docs/03-architecture/sequence-diagram-UC-004.puml

.PHONY: help doctor init dev dev-local wait-db up down stop destroy restart ps logs test test-cov test-db lint check build build-local seed-admin token docs perf clean

help: ## muestra esta ayuda
	@awk 'BEGIN {FS = ":.*##"; printf "Uso: make <target> [ARGS=\"...\"]\n\nTargets:\n"} /^[a-z0-9-]+:.*##/ {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

doctor: ## verifica toolchain (docker, compose, node; plantuml/k6 solo avisan)
	@command -v docker >/dev/null || (echo "ERROR: falta docker" && exit 1)
	@docker compose version >/dev/null || (echo "ERROR: falta el plugin docker compose" && exit 1)
	@node --version
	@command -v plantuml >/dev/null && echo "plantuml ok" || echo "AVISO: sin plantuml (solo afecta 'make docs')"
	@command -v k6 >/dev/null && echo "k6 ok" || echo "AVISO: sin k6 (solo afecta 'make perf')"

init: doctor ## instala deps y crea el .env unico en raiz (falla si JWT_SECRET sigue placeholder)
	@test -d $(BACKEND)/node_modules || (cd $(BACKEND) && npm ci --no-audit --no-fund)
	@test -d $(FRONTEND)/node_modules || (cd $(FRONTEND) && npm ci --no-audit --no-fund)
	@test -f .env || cp $(BACKEND)/.env.example .env
	@if test -f $(BACKEND)/.env; then \
		if cmp -s $(BACKEND)/.env $(BACKEND)/.env.example; then rm $(BACKEND)/.env && echo "backend/.env heredado (igual al ejemplo) eliminado: rige el .env raiz"; \
		else echo "AVISO: backend/.env personalizado queda inerte (dev-local ahora usa el .env raiz); migralo a .env y borralo"; fi; \
	fi
	@if grep -q '^JWT_SECRET=$(SECRET_PLACEHOLDER)$$' .env; then echo "ERROR: completar JWT_SECRET en .env (NFR-004: sin default)"; exit 1; fi
	@echo "init ok"

dev: ## entorno dev aislado Node 22 + HMR (attached; ARGS="-d" para detached)
	$(COMPOSE_DEV) up --build $(ARGS)

wait-db:
	@echo "esperando MariaDB (hasta 60s)..."
	@for i in $$(seq 1 30); do \
		$(COMPOSE) exec -T db sh -c 'mariadb -u"$$MARIADB_USER" -p"$$MARIADB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1' && break; \
		sleep 2; \
	done
	@$(COMPOSE) exec -T db sh -c 'mariadb -u"$$MARIADB_USER" -p"$$MARIADB_PASSWORD" -e "SELECT 1" >/dev/null' || (echo "ERROR: db no responde" && exit 1)

dev-local: ## db en compose + api/web por npm local, con el .env raiz (rapido; requiere Node 22)
	@node --version | grep -q '^v22' || echo "AVISO: node local no es v22 (prod usa Node 22)"
	@test -f .env || (echo "ERROR: falta .env (make init)" && exit 1)
	@if grep -q '^JWT_SECRET=$(SECRET_PLACEHOLDER)$$' .env; then echo "ERROR: completar JWT_SECRET en .env"; exit 1; fi
	$(COMPOSE) up -d db
	$(MAKE) wait-db
	@(trap 'kill 0' INT TERM; set -o allexport; . ./.env; set +o allexport; cd $(BACKEND) && npm run start:dev & cd $(FRONTEND) && npm run dev & wait)

up: ## despliegue prod detached (compose up --build -d)
	$(COMPOSE) up --build -d $(ARGS)

down: stop ## alias de stop
stop: ## apaga contenedores conservando volumenes (DB y uploads sobreviven)
	$(COMPOSE) down

destroy: ## BORRA contenedores + volumenes (se pierde DB y uploads). Requiere CONFIRM=yes
	@test "$(CONFIRM)" = "yes" || (echo "esto borra la DB. Reintentar con CONFIRM=yes" && exit 1)
	$(COMPOSE) down -v

restart: ## reinicia entorno dev (down + dev)
	$(COMPOSE) down
	$(COMPOSE_DEV) up --build $(ARGS)

ps: ## estado de servicios
	$(COMPOSE) ps

logs: ## sigue logs (ARGS="api" para un solo servicio)
	$(COMPOSE) logs -f $(ARGS)

test: ## jest backend + vitest frontend (rapido, sin DB)
	cd $(BACKEND) && npm test
	cd $(FRONTEND) && npm test

test-cov: ## jest con cobertura y gate 80% en capas testeables (ver jest.config.js)
	cd $(BACKEND) && npm run test:cov

test-db: ## levanta db y corre la suite (lista para GAP-002 DB-backed)
	$(COMPOSE) up -d db
	$(MAKE) wait-db
	cd $(BACKEND) && npm test

lint: ## eslint + tsc backend y frontend
	cd $(BACKEND) && npm run lint
	cd $(BACKEND) && npx tsc --noEmit -p tsconfig.json
	cd $(FRONTEND) && npx tsc --noEmit

check: lint test test-cov ## puerta calidad: lint + tests + cobertura con gate

build: ## construye imagenes prod
	$(COMPOSE) build

build-local: ## tsc + vite locales (rapido, sin docker)
	cd $(BACKEND) && npm run build
	cd $(FRONTEND) && npm run build

seed-admin: ## crea/promueve Admin: make seed-admin EMAIL=x PASSWORD=y (requiere imagen api + db up)
	@test -n "$${SEED_EMAIL:-$(EMAIL)}" || (echo "uso: make seed-admin EMAIL=x PASSWORD=y" && exit 1)
	@test -n "$${SEED_PASSWORD:-$(PASSWORD)}" || (echo "uso: make seed-admin EMAIL=x PASSWORD=y" && exit 1)
	@echo "$${SEED_EMAIL:-$(EMAIL)}" | grep -q '@' || (echo "ERROR: EMAIL invalido" && exit 1)
	@SEED_PW="$${SEED_PASSWORD:-$(PASSWORD)}"; test $${#SEED_PW} -ge 8 || (echo "ERROR: PASSWORD >= 8 (BR-003)" && exit 1)
	@export SEED_EMAIL="$${SEED_EMAIL:-$(EMAIL)}"; export SEED_PASSWORD="$${SEED_PASSWORD:-$(PASSWORD)}"; \
	$(COMPOSE) run --rm -e SEED_EMAIL -e SEED_PASSWORD api node -e 'const bcrypt=require("bcrypt");const mysql=require("mysql2/promise");(async()=>{const hash=await bcrypt.hash(process.env.SEED_PASSWORD,10);const conn=await mysql.createConnection({host:process.env.DB_HOST||"db",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});const email=String(process.env.SEED_EMAIL).trim().toLowerCase();await conn.execute("INSERT INTO users (email,password_hash,role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE role=VALUES(role),password_hash=VALUES(password_hash)",[email,hash,"Admin"]);const rows=await conn.execute("SELECT id,email,role FROM users WHERE email=?",[email]);console.log("seed-admin ok:",JSON.stringify(rows[0]));await conn.end();})().catch((e)=>{console.error("seed-admin fallo:",e.message);process.exit(1)});'

token: ## imprime JWT: make token EMAIL=x PASSWORD=y (requiere api up)
	@test -n "$(EMAIL)" && test -n "$(PASSWORD)" || (echo "uso: make token EMAIL=x PASSWORD=y" && exit 1)
	@export TOKEN_E="$(EMAIL)" TOKEN_P="$(PASSWORD)"; curl -s -X POST "$${API_URL:-$(API_URL_DEFAULT)}/auth/login" -H 'Content-Type: application/json' -d "$$(node -e 'console.log(JSON.stringify({email:process.env.TOKEN_E,password:process.env.TOKEN_P}))')" | node -e 'let d="";process.stdin.on("data",c=>{d+=c}).on("end",()=>{try{const j=JSON.parse(d);if(!j.token){console.error("login fallo:",d);process.exit(1)}console.log(j.token)}catch(e){console.error("respuesta no-JSON:",d);process.exit(1)}});'

docs: ## re-renderiza diagramas PlantUML a SVG (mismo nombre que el .puml)
	@command -v plantuml >/dev/null || (echo "ERROR: instalar plantuml" && exit 1)
	@for p in $(PUML); do plantuml -tsvg -pipe < "$$p" > "$${p%.puml}.svg" || exit 1; done
	@echo "docs ok"

perf: ## k6 NFR-001+NFR-002. Uso: make perf JWT=$$(make token EMAIL=p PASSWORD=...) [API_URL=... FILE=...]
	@command -v k6 >/dev/null || (echo "k6 no instalado: https://k6.io/docs/get-started/installation/" && exit 1)
	@test -n "$(JWT)" || (echo "falta JWT de Professor/Admin (make token EMAIL=x PASSWORD=y)" && exit 1)
	API_URL="$${API_URL:-$(API_URL_DEFAULT)}" JWT="$(JWT)" k6 run $(BACKEND)/tests/perf/k6/perf-catalog.js
	@test -f "$${FILE:-$(UPLOAD_FIXTURE)}" || (echo "falta fixture 50MB: head -c 52428800 /dev/urandom > $${FILE:-$(UPLOAD_FIXTURE)}" && exit 1)
	FILE="$${FILE:-$(UPLOAD_FIXTURE)}" API_URL="$${API_URL:-$(API_URL_DEFAULT)}" JWT="$(JWT)" k6 run $(BACKEND)/tests/perf/k6/perf-upload.js

clean: ## borra artefactos locales (dist, coverage, uploads). Nunca volumenes
	rm -rf $(BACKEND)/dist $(BACKEND)/coverage $(FRONTEND)/dist $(BACKEND)/uploads
