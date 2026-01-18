-- =============================================
-- Route-Business Affiliation System
-- Adds request/approval workflow for businesses to join routes
-- =============================================

-- Add status column to route_businesses if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'route_businesses' AND column_name = 'status'
    ) THEN
        ALTER TABLE route_businesses 
        ADD COLUMN status VARCHAR(20) DEFAULT 'aprobado' CHECK (status IN ('pendiente', 'aprobado', 'rechazado'));
    END IF;
END $$;

-- Add requested_at column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'route_businesses' AND column_name = 'requested_at'
    ) THEN
        ALTER TABLE route_businesses 
        ADD COLUMN requested_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add approved_at column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'route_businesses' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE route_businesses 
        ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add message column for request message
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'route_businesses' AND column_name = 'request_message'
    ) THEN
        ALTER TABLE route_businesses 
        ADD COLUMN request_message TEXT;
    END IF;
END $$;

-- =============================================
-- RLS Policies for Route-Business affiliations
-- =============================================

-- Enable RLS
ALTER TABLE route_businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved affiliations" ON route_businesses;
DROP POLICY IF EXISTS "Business owners can view their affiliation requests" ON route_businesses;
DROP POLICY IF EXISTS "Route creators can view affiliation requests" ON route_businesses;
DROP POLICY IF EXISTS "Business owners can request affiliation" ON route_businesses;
DROP POLICY IF EXISTS "Route creators can update affiliation status" ON route_businesses;

-- Anyone can view approved affiliations
CREATE POLICY "Anyone can view approved affiliations"
ON route_businesses FOR SELECT
TO authenticated
USING (status = 'aprobado');

-- Business owners can view their own affiliation requests (any status)
CREATE POLICY "Business owners can view their affiliation requests"
ON route_businesses FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
);

-- Route creators can view affiliation requests for their routes
CREATE POLICY "Route creators can view affiliation requests"
ON route_businesses FOR SELECT
TO authenticated
USING (
    route_id IN (
        SELECT id FROM routes WHERE creator_id = auth.uid()
    )
);

-- Business owners can request affiliation (insert with pending status)
CREATE POLICY "Business owners can request affiliation"
ON route_businesses FOR INSERT
TO authenticated
WITH CHECK (
    business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    AND status = 'pendiente'
);

-- Route creators can update affiliation status (approve/reject)
CREATE POLICY "Route creators can update affiliation status"
ON route_businesses FOR UPDATE
TO authenticated
USING (
    route_id IN (
        SELECT id FROM routes WHERE creator_id = auth.uid()
    )
);

-- =============================================
-- Function to find nearby routes for a business
-- =============================================

CREATE OR REPLACE FUNCTION find_routes_near_business(
    p_business_id UUID,
    p_radius_km NUMERIC DEFAULT 5
)
RETURNS TABLE (
    route_id UUID,
    route_name VARCHAR,
    route_slug VARCHAR,
    creator_name VARCHAR,
    distance_km NUMERIC,
    already_affiliated BOOLEAN,
    affiliation_status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    business_location GEOMETRY;
BEGIN
    -- Get business location
    SELECT location INTO business_location
    FROM businesses
    WHERE id = p_business_id;
    
    IF business_location IS NULL THEN
        RAISE EXCEPTION 'Business not found or has no location';
    END IF;
    
    RETURN QUERY
    SELECT 
        r.id AS route_id,
        r.name AS route_name,
        r.slug AS route_slug,
        p.full_name AS creator_name,
        ROUND((ST_Distance(
            business_location::geography,
            r.route_path::geography
        ) / 1000)::numeric, 2) AS distance_km,
        EXISTS (
            SELECT 1 FROM route_businesses rb 
            WHERE rb.route_id = r.id AND rb.business_id = p_business_id
        ) AS already_affiliated,
        COALESCE(
            (SELECT rb.status FROM route_businesses rb 
             WHERE rb.route_id = r.id AND rb.business_id = p_business_id),
            NULL
        ) AS affiliation_status
    FROM routes r
    LEFT JOIN profiles p ON r.creator_id = p.id
    WHERE r.status = 'publicado'
    AND ST_DWithin(
        business_location::geography,
        r.route_path::geography,
        p_radius_km * 1000
    )
    ORDER BY distance_km ASC;
END;
$$;

-- =============================================
-- Function to request affiliation
-- =============================================

CREATE OR REPLACE FUNCTION request_route_affiliation(
    p_business_id UUID,
    p_route_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business RECORD;
    v_route RECORD;
    v_distance_m NUMERIC;
    v_existing RECORD;
    v_result JSON;
BEGIN
    -- Check if user owns the business
    SELECT * INTO v_business
    FROM businesses
    WHERE id = p_business_id AND owner_id = auth.uid();
    
    IF v_business IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No tienes permiso para este comercio');
    END IF;
    
    -- Get route info
    SELECT * INTO v_route
    FROM routes
    WHERE id = p_route_id AND status = 'publicado';
    
    IF v_route IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Ruta no encontrada o no está publicada');
    END IF;
    
    -- Check if already affiliated
    SELECT * INTO v_existing
    FROM route_businesses
    WHERE route_id = p_route_id AND business_id = p_business_id;
    
    IF v_existing IS NOT NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Ya existe una solicitud para esta ruta',
            'status', v_existing.status
        );
    END IF;
    
    -- Calculate distance from route
    SELECT ROUND(ST_Distance(
        v_business.location::geography,
        v_route.route_path::geography
    )::numeric, 0)
    INTO v_distance_m;
    
    -- Insert affiliation request
    INSERT INTO route_businesses (
        route_id, 
        business_id, 
        distance_from_route_m, 
        status, 
        request_message,
        requested_at
    ) VALUES (
        p_route_id,
        p_business_id,
        v_distance_m,
        'pendiente',
        p_message,
        NOW()
    );
    
    -- Create notification for route creator
    INSERT INTO notifications (
        user_id,
        title,
        body,
        notification_type,
        related_business_id,
        related_route_id
    ) VALUES (
        v_route.creator_id,
        '¡Solicitud de afiliación! 🏪',
        v_business.name || ' quiere unirse a tu ruta "' || v_route.name || '"',
        'solicitud_afiliacion',
        p_business_id,
        p_route_id
    );
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Solicitud enviada correctamente',
        'distance_m', v_distance_m
    );
END;
$$;

-- =============================================
-- Function to approve/reject affiliation
-- =============================================

CREATE OR REPLACE FUNCTION respond_affiliation_request(
    p_route_id UUID,
    p_business_id UUID,
    p_approved BOOLEAN,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_route RECORD;
    v_business RECORD;
    v_affiliation RECORD;
BEGIN
    -- Check if user owns the route
    SELECT * INTO v_route
    FROM routes
    WHERE id = p_route_id AND creator_id = auth.uid();
    
    IF v_route IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No tienes permiso para esta ruta');
    END IF;
    
    -- Get affiliation request
    SELECT * INTO v_affiliation
    FROM route_businesses
    WHERE route_id = p_route_id AND business_id = p_business_id AND status = 'pendiente';
    
    IF v_affiliation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Solicitud no encontrada');
    END IF;
    
    -- Get business info for notification
    SELECT * INTO v_business
    FROM businesses
    WHERE id = p_business_id;
    
    -- Update affiliation status
    UPDATE route_businesses
    SET 
        status = CASE WHEN p_approved THEN 'aprobado' ELSE 'rechazado' END,
        approved_at = CASE WHEN p_approved THEN NOW() ELSE NULL END,
        notes = COALESCE(p_notes, notes)
    WHERE route_id = p_route_id AND business_id = p_business_id;
    
    -- Create notification for business owner
    INSERT INTO notifications (
        user_id,
        title,
        body,
        notification_type,
        related_business_id,
        related_route_id
    ) VALUES (
        v_business.owner_id,
        CASE WHEN p_approved THEN '¡Afiliación aprobada! 🎉' ELSE 'Solicitud rechazada' END,
        CASE WHEN p_approved 
            THEN 'Tu comercio "' || v_business.name || '" ahora está en la ruta "' || v_route.name || '". ¡Ya puedes recibir pedidos!'
            ELSE 'Tu solicitud para la ruta "' || v_route.name || '" fue rechazada.'
        END,
        CASE WHEN p_approved THEN 'afiliacion_aprobada' ELSE 'afiliacion_rechazada' END,
        p_business_id,
        p_route_id
    );
    
    RETURN json_build_object(
        'success', true, 
        'message', CASE WHEN p_approved THEN 'Afiliación aprobada' ELSE 'Solicitud rechazada' END
    );
END;
$$;

-- =============================================
-- Function to get pending affiliation requests for route creator
-- =============================================

CREATE OR REPLACE FUNCTION get_pending_affiliation_requests(p_route_id UUID DEFAULT NULL)
RETURNS TABLE (
    affiliation_id UUID,
    route_id UUID,
    route_name VARCHAR,
    business_id UUID,
    business_name VARCHAR,
    business_type VARCHAR,
    business_logo VARCHAR,
    distance_m INTEGER,
    request_message TEXT,
    requested_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rb.id AS affiliation_id,
        rb.route_id,
        r.name AS route_name,
        rb.business_id,
        b.name AS business_name,
        b.business_type::VARCHAR,
        b.logo_url AS business_logo,
        rb.distance_from_route_m::INTEGER AS distance_m,
        rb.request_message,
        rb.requested_at
    FROM route_businesses rb
    JOIN routes r ON rb.route_id = r.id
    JOIN businesses b ON rb.business_id = b.id
    WHERE rb.status = 'pendiente'
    AND r.creator_id = auth.uid()
    AND (p_route_id IS NULL OR rb.route_id = p_route_id)
    ORDER BY rb.requested_at DESC;
END;
$$;
