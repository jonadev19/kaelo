-- Enable required PostgreSQL extensions
-- PostGIS: For geospatial data and geometric operations
-- UUID-OSSP: For generating UUIDs

-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
