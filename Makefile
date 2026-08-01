.PHONY: help up down restart logs build test dev-install

help:
	@echo "Udaan AI - Makefile Commands"
	@echo "----------------------------"
	@echo "  make up          : Start all services using Docker Compose"
	@echo "  make down        : Stop all services using Docker Compose"
	@echo "  make restart     : Restart all Docker Compose services"
	@echo "  make logs        : View logs for all services"
	@echo "  make build       : Build all Docker containers"
	@echo "  make test        : Run pytest health tests across all services"

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

test:
	@echo "Running backend health tests..."
	python -m pytest backend/api-gateway
	python -m pytest backend/auth-service
	python -m pytest backend/student-service
	python -m pytest backend/assessment-service
	python -m pytest backend/ai-career-service
	python -m pytest backend/roadmap-service
	python -m pytest backend/institution-service
	python -m pytest backend/admin-analytics-service
