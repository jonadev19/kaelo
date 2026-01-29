# 04 - Edge Cases

**Version:** 1.1
**Last Updated:** Enero 2026

## 11. IDENTIFICACIÓN DE EDGE CASES CRÍTICOS

### 🔴 EDGE CASE #1: Network Partition durante Order Placement

#### Scenario:
1. User selecciona productos y procede a checkout
2. Payment intent se crea en Stripe (200 OK)
3. Network failure ANTES de que order se persista en DB
4. User ve "Error de conexión" y reintenta
5. Se crea DUPLICATE payment intent pero order original nunca se guardó

#### Impact:
- User charged 2x
- Merchant nunca recibe ningún order
- Inconsistent state entre Stripe y DB

#### Mitigation Strategy:

```javascript
// Implementar Idempotency Keys
const createOrder = async (orderData) => {
    const idempotencyKey = `order_${userId}_${timestamp}_${cartHash}`;

    try {
        // 1. Create payment intent with idempotency key
        const paymentIntent = await stripe.paymentIntents.create({
            amount: orderData.total * 100,
            currency: 'mxn',
            metadata: { idempotencyKey }
        }, {
            idempotencyKey // Stripe prevents duplicates
        });

        // 2. Persist order in transaction with retry logic
        const { data, error } = await supabase.rpc('create_order_atomic', {
            order_data: orderData,
            payment_intent_id: paymentIntent.id,
            idempotency_key: idempotencyKey
        });

        if (error) throw error;

        // 3. Confirm payment only after DB success
        await stripe.paymentIntents.confirm(paymentIntent.id);

        return data;
    } catch (error) {
        // Rollback: Cancel payment intent if DB fails
        if (paymentIntent?.id) {
            await stripe.paymentIntents.cancel(paymentIntent.id);
        }
        throw error;
    }
};
```

```sql
-- Database-side function (Postgres)
CREATE OR REPLACE FUNCTION create_order_atomic(
    order_data JSONB,
    payment_intent_id TEXT,
    idempotency_key TEXT
) RETURNS JSONB AS $$
DECLARE
    existing_order UUID;
    new_order_id UUID;
BEGIN
    -- Check for duplicate via idempotency key
    SELECT id INTO existing_order
    FROM orders
    WHERE metadata->>'idempotency_key' = idempotency_key;

    IF existing_order IS NOT NULL THEN
        -- Return existing order (idempotent)
        RETURN (SELECT row_to_json(orders.*) FROM orders WHERE id = existing_order);
    END IF;

    -- Create new order atomically
    INSERT INTO orders (user_id, merchant_id, total_amount, payment_intent_id, metadata)
    VALUES (
        (order_data->>'user_id')::UUID,
        (order_data->>'merchant_id')::UUID,
        (order_data->>'total_amount')::NUMERIC,
        payment_intent_id,
        jsonb_build_object('idempotency_key', idempotency_key)
    )
    RETURNING id INTO new_order_id;

    -- Insert order items
    -- ... (insert logic)

    RETURN (SELECT row_to_json(orders.*) FROM orders WHERE id = new_order_id);
END;
$$ LANGUAGE plpgsql;
```

#### Monitoring:
- Alert en Sentry si payment intent existe pero order no
- Daily reconciliation job (Stripe vs DB)

---

### 🔴 EDGE CASE #2: Concurrent Stock Updates (Race Condition)

#### Scenario:
1. Product tiene stock = 1
2. User A y User B agregan producto a cart simultáneamente
3. Ambos ven "Available" en UI
4. Ambos procesan checkout
5. AMBOS orders se crean (overselling)
6. Merchant solo puede cumplir 1 order

#### Impact:
- Merchant debe cancelar order, refund user
- Poor UX, potential review bombing
- Inventory inconsistencies

#### Mitigation Strategy:

```sql
-- Optimistic Locking con Row-Level Versioning
ALTER TABLE products ADD COLUMN version INTEGER DEFAULT 1;

-- Database function con pessimistic locking
CREATE OR REPLACE FUNCTION reserve_stock_atomic(
    items JSONB
) RETURNS JSONB AS $$
DECLARE
    item JSONB;
    product_row products%ROWTYPE;
    unavailable_items JSONB := '[]'::JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        -- Lock row for update (pessimistic lock)
        SELECT * INTO product_row
        FROM products
        WHERE id = (item->>'product_id')::UUID
        FOR UPDATE; -- Blocks concurrent updates

        -- Check stock availability
        IF product_row.stock < (item->>'quantity')::INTEGER THEN
            unavailable_items := unavailable_items || jsonb_build_object(
                'product_id', product_row.id,
                'requested', item->>'quantity',
                'available', product_row.stock
            );
            CONTINUE;
        END IF;

        -- Decrement stock atomically
        UPDATE products
        SET
            stock = stock - (item->>'quantity')::INTEGER,
            version = version + 1,
            updated_at = NOW()
        WHERE
            id = product_row.id
            AND version = product_row.version; -- Optimistic lock check

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CONCURRENT_MODIFICATION: Product % was modified', product_row.id;
        END IF;
    END LOOP;

    IF jsonb_array_length(unavailable_items) > 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK'
            USING DETAIL = unavailable_items::TEXT;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

#### Additional Safeguards:
- Client-side: Poll stock every 30s durante checkout (warn user si cambia)
- Reservation timeout: Auto-release reserved stock after 10 min sin payment
- Queue system para high-demand products (waitlist)

---

### 🔴 EDGE CASE #3: Offline-First Sync Conflicts

#### Scenario:
1. User descarga ruta en WiFi (version 1)
2. Durante ride, user pierde conexión 30 min
3. Admin actualiza ruta (cierra POI, version 2)
4. User regresa a conexión, app intenta sync
5. Conflict: local version 1 vs server version 2

#### Impact:
- User navega a POI cerrado (poor UX)
- Potential data loss si user hizo edits offline
- Inconsistent map rendering

#### Mitigation Strategy:

```javascript
// Conflict Resolution Strategy: Server Wins con User Notification
const syncOfflineChanges = async () => {
    const localRoutes = await AsyncStorage.getItem('offline_routes');
    const conflicts = [];

    for (const route of JSON.parse(localRoutes)) {
        // Fetch server version
        const { data: serverRoute } = await supabase
            .from('routes')
            .select('*, version, updated_at')
            .eq('id', route.id)
            .single();

        // Detect conflict
        if (serverRoute.version > route.version) {
            conflicts.push({
                entity: `Route:${route.name}`,
                localVersion: route.version,
                serverVersion: serverRoute.version,
                resolution: 'server_wins'
            });

            // Server wins: Update local copy
            await AsyncStorage.setItem(
                `offline_route_${route.id}`,
                JSON.stringify(serverRoute)
            );

            // Notify user
            await showNotification({
                title: 'Ruta Actualizada',
                body: `"${route.name}" tiene cambios recientes. Revisa los detalles.`,
                data: { routeId: route.id }
            });
        }
    }

    return {
        status: conflicts.length > 0 ? 'conflict' : 'success',
        conflicts
    };
};
```

```sql
-- Implement version tracking in database
ALTER TABLE routes ADD COLUMN version INTEGER DEFAULT 1;

CREATE OR REPLACE FUNCTION increment_route_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER route_version_trigger
BEFORE UPDATE ON routes
FOR EACH ROW
EXECUTE FUNCTION increment_route_version();
```

#### Data Integrity Rules:
- Last-Write-Wins (LWW) con server timestamp
- Never allow offline edits de datos críticos (payments, orders)
- Periodic background sync (cada 5 min cuando online)
- Manual refresh button en UI para force sync

---

### 🟡 EDGE CASE #4: GPS Signal Loss During Activity Tracking

#### Scenario:
1. User inicia tracking de actividad en ruta (RF-015)
2. User entra en zona con mala señal GPS (túnel, cañón, zona boscosa)
3. GPS reporta posiciones inexactas o ninguna por 5+ minutos
4. User sale de zona y GPS se recupera
5. Track tiene "saltos" o gaps significativos

#### Impact:
- Métricas de distancia/velocidad incorrectas
- Track en mapa se ve discontinuo
- Comparaciones de rendimiento poco confiables

#### Mitigation Strategy:

```javascript
// Interpolation + Quality Flags
const handleGPSUpdate = (position: GeolocationPosition) => {
    const accuracy = position.coords.accuracy;
    const timeSinceLastUpdate = Date.now() - lastGPSTimestamp;

    // Flag low-quality segments
    if (accuracy > 50) { // > 50m accuracy = low quality
        currentActivity.lowQualitySegments.push({
            startTime: lastGPSTimestamp,
            endTime: Date.now(),
            reason: 'poor_gps_accuracy'
        });
    }

    // Detect large gaps
    if (timeSinceLastUpdate > 60000) { // > 1 min gap
        currentActivity.gaps.push({
            duration: timeSinceLastUpdate,
            interpolated: true
        });
        
        // Interpolate distance (straight line, conservative estimate)
        const interpolatedDistance = calculateHaversine(lastPosition, position);
        currentActivity.interpolatedKm += interpolatedDistance;
    }

    // Update metrics
    updateActivityMetrics(position, {
        isInterpolated: timeSinceLastUpdate > 60000,
        accuracy: accuracy
    });
};
```

#### UI Indicators:
- Mostrar indicador de "GPS débil" en pantalla
- En historial, marcar actividades con >10% datos interpolados
- Opción para editar/corregir tracks manualmente

---

### 🟡 EDGE CASE #5: App Killed by OS During Active Route

#### Scenario:
1. User en medio de ruta con tracking activo
2. OS mata la app (memory pressure, battery saver, user accidente)
3. User reabre app 30 min después
4. Actividad estaba "in_progress" pero no hay datos de 30 min

#### Impact:
- Pérdida de datos de tracking
- Actividad incompleta en historial
- Métricas incorrectas

#### Mitigation Strategy:

```javascript
// Persistent Activity State + Background Location
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error(error);
        return;
    }
    
    const { locations } = data;
    
    // Persist to AsyncStorage immediately
    const currentTrack = await AsyncStorage.getItem('active_track');
    const track = JSON.parse(currentTrack) || [];
    track.push(...locations.map(loc => ({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        timestamp: loc.timestamp,
        accuracy: loc.coords.accuracy
    })));
    
    await AsyncStorage.setItem('active_track', JSON.stringify(track));
});

// On app resume
const resumeActivity = async () => {
    const savedTrack = await AsyncStorage.getItem('active_track');
    const activityState = await AsyncStorage.getItem('activity_state');
    
    if (activityState === 'in_progress' && savedTrack) {
        // Prompt user to continue or discard
        Alert.alert(
            'Actividad Interrumpida',
            '¿Deseas continuar la actividad anterior o descartarla?',
            [
                { text: 'Continuar', onPress: () => resumeTracking(savedTrack) },
                { text: 'Descartar', onPress: () => discardActivity() },
                { text: 'Guardar Parcial', onPress: () => savePartialActivity(savedTrack) }
            ]
        );
    }
};
```

#### Safeguards:
- Guardar track cada 10 segundos en AsyncStorage
- Background location con Expo TaskManager
- Al reabrir, ofrecer opciones claras al usuario

---

### 🟡 EDGE CASE #6: Multi-Device Activity Sync Conflict

#### Scenario:
1. User inicia actividad en iPhone
2. User abre app en iPad (login mismo)
3. Ambos devices muestran "actividad en progreso"
4. User completa en iPhone
5. iPad tiene datos locales que no existen en server

#### Impact:
- Actividades duplicadas
- Métricas agregadas incorrectas
- Confusión del usuario

#### Mitigation Strategy:

```sql
-- Constraint: Solo una actividad in_progress por usuario
CREATE UNIQUE INDEX idx_one_active_activity_per_user 
ON user_activities(user_id) 
WHERE status = 'in_progress';
```

```javascript
// Check for active activity before starting
const startActivity = async (routeId: string) => {
    // Check if another device has active activity
    const { data: activeActivity } = await supabase
        .from('user_activities')
        .select('id, started_at, device_id')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .single();

    if (activeActivity && activeActivity.device_id !== currentDeviceId) {
        Alert.alert(
            'Actividad en Otro Dispositivo',
            `Tienes una actividad iniciada en otro dispositivo (${formatTime(activeActivity.started_at)}). ¿Deseas terminarla y empezar aquí?`,
            [
                { text: 'Continuar Allá', style: 'cancel' },
                { text: 'Transferir Aquí', onPress: () => transferActivity(activeActivity.id) }
            ]
        );
        return;
    }

    // Start new activity
    await createActivity(routeId);
};
```

---

**Related Documents:**
- [02 - Requirements](./02-requirements.md)
- [05 - Testing Strategy](./05-testing-strategy.md)
- [09 - Security](./09-security.md)
