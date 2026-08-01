-- PostgreSQL Schema Initialization for Udaan AI Phase 1
-- Creates isolated schemas for each microservice boundary

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS student;
CREATE SCHEMA IF NOT EXISTS assessment;
CREATE SCHEMA IF NOT EXISTS career_ai;
CREATE SCHEMA IF NOT EXISTS roadmap;
CREATE SCHEMA IF NOT EXISTS institution;
CREATE SCHEMA IF NOT EXISTS admin_analytics;

-- Set search path or grant privileges if needed
COMMENT ON SCHEMA auth IS 'Schema owned by Auth Service';
COMMENT ON SCHEMA student IS 'Schema owned by Student Profile Service';
COMMENT ON SCHEMA assessment IS 'Schema owned by Assessment Service';
COMMENT ON SCHEMA career_ai IS 'Schema owned by AI Career Intelligence Service';
COMMENT ON SCHEMA roadmap IS 'Schema owned by Career Roadmap Service';
COMMENT ON SCHEMA institution IS 'Schema owned by Institution Service';
COMMENT ON SCHEMA admin_analytics IS 'Schema owned by Admin and Analytics Service';
