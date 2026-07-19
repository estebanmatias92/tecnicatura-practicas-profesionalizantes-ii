.DEFAULT_GOAL := help

.PHONY: up down destroy logs restart status help

up:
	docker compose up --build -d

down:
	docker compose down

destroy:
	docker compose down -v

logs:
	docker compose logs -f app

restart: down up

status:
	docker compose ps

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Available targets:"
	@echo "  up        docker compose up --build -d"
	@echo "  down      docker compose down"
	@echo "  destroy   docker compose down -v (remove volumes)"
	@echo "  logs      docker compose logs -f app"
	@echo "  restart   down + up (quick restart)"
	@echo "  status    docker compose ps"
	@echo "  help      show this help message"
