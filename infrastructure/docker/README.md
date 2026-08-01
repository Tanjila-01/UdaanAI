# Docker Infrastructure

This directory contains containerization guidelines and Docker setup files for Udaan AI.

## Docker Setup

- All 8 backend microservices have individual `Dockerfile`s based on `python:3.11-slim`.
- The frontend has a `Dockerfile` based on `node:20-alpine`.
- Root `docker-compose.yml` orchestrates all 10 containers (PostgreSQL + 8 Backend microservices + 1 Frontend container).
