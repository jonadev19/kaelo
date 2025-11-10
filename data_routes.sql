
-- Insert 50 routes
INSERT INTO public.routes (creator_id, title, distance_km, difficulty, price, description, status, route_geometry, gpx_file_url, estimated_time_hours, elevation_gain_m, published_at)
SELECT
    (SELECT id FROM public.users ORDER BY random() LIMIT 1),
    'Route ' || i,
    random() * 100,
    (array['facil', 'intermedia', 'dificil'])[floor(random() * 3) + 1]::difficulty_level,
    random() * 50,
    'Description for route ' || i,
    (array['borrador', 'publicada'])[floor(random() * 2) + 1]::route_status,
    ST_MakeLine(
        ARRAY[
            ST_MakePoint(random()*360-180, random()*180-90),
            ST_MakePoint(random()*360-180, random()*180-90),
            ST_MakePoint(random()*360-180, random()*180-90)
        ]
    ),
    'https://example.com/gpx/' || i || '.gpx',
    random() * 5,
    floor(random() * 1000),
    CASE
        WHEN random() > 0.2 THEN NOW() - (random() * interval '90 days')
        ELSE NULL
    END
FROM generate_series(1, 50) AS i;
