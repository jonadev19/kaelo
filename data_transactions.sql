
-- Insert 50 transactions
INSERT INTO public.transactions (user_id, transaction_type, amount, payment_status, route_id, order_id, payment_method, payment_gateway_id, completed_at)
SELECT
    (SELECT id FROM public.users ORDER BY random() LIMIT 1),
    (array['compra_ruta', 'pedido_comercio'])[floor(random() * 2) + 1]::transaction_type,
    random() * 200,
    (array['pendiente', 'completado'])[floor(random() * 2) + 1]::payment_status,
    CASE
        WHEN random() > 0.5 THEN (SELECT id FROM public.routes ORDER BY random() LIMIT 1)
        ELSE NULL
    END,
    NULL,
    (array['tarjeta_credito', 'paypal', 'transferencia'])[floor(random() * 3) + 1],
    'gateway_' || substr(md5(random()::text), 0, 10),
    CASE
        WHEN random() > 0.5 THEN NOW() - (random() * interval '30 days')
        ELSE NULL
    END
FROM generate_series(1, 50) AS i;
