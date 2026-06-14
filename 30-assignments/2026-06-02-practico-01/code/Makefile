.PHONY: up down destroy logs restart status

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
