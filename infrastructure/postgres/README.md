# PostgreSQL Infrastructure

This directory contains database configuration and initialization scripts for local development.

## Isolated Microservice Schemas

During Phase 1, a single PostgreSQL instance is shared across microservices using isolated database schemas:

1. `auth` - Auth Service
2. `student` - Student Profile Service
3. `assessment` - Assessment Service
4. `career_ai` - AI Career Intelligence Service
5. `roadmap` - Career Roadmap Service
6. `institution` - Institution Service
7. `admin_analytics` - Admin and Analytics Service

`init-schemas.sql` is automatically mounted into `/docker-entrypoint-initdb.d/` in the Docker container to initialize these schemas upon container startup.
