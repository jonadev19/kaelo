# Edge Case Addition Template

**ID:** EC-XXX
**Fecha:** YYYY-MM-DD

---

## 📋 Edge Case Información

| Campo | Valor |
|-------|-------|
| **Edge Case Title** | [Título descriptivo] |
| **Categoría** | Network / Concurrency / Data / Payment / User Input |
| **Severity** | 🔴 Critical / 🟡 Medium / 🟢 Low |
| **Módulo Afectado** | User / Merchant / Admin / System |

---

## 🎬 Scenario Description

**Describe el escenario exacto del edge case:**

### Paso a Paso:
1. [Acción 1]
2. [Acción 2]
3. [Condición anómala]
4. [Resultado inesperado]
5. [Consecuencia]

**Ejemplo:**
> **EC-004: Payment Success but Order Not Created**
> 1. User completa checkout y procesa pago
> 2. Stripe confirma pago (200 OK)
> 3. Database write falla por timeout
> 4. User ve "Pago exitoso" pero no hay order en DB
> 5. User charged pero merchant no recibe order

---

## 💥 Impact Assessment

### Impacto en Usuario
- **Severidad:** 🔴 Crítico / 🟡 Molesto / 🟢 Menor
- **Frecuencia Estimada:** [Cuántas veces puede ocurrir?]
- **User Experience:** [Qué ve/experimenta el usuario?]

**Ejemplo:**
> - **Severidad:** 🔴 Crítico (user pierde dinero)
> - **Frecuencia:** Baja (~0.1% de orders bajo alta carga)
> - **UX:** User ve confirmación pero nunca recibe pedido

### Impacto en Negocio
- **Revenue Impact:** ✅ Ninguno / ⚠️ Bajo / 🔴 Alto
- **Merchant Impact:** [Cómo afecta a merchants?]
- **Reputational Risk:** [Impacto en ratings/reviews?]

---

## 🛡️ Mitigation Strategy

### Estrategia Técnica

**Approach:** [Describe la solución técnica]

**Code Example:**

```javascript
// Ejemplo de implementación
async function createOrderWithRetry(orderData) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await createOrder(orderData);
      return result;
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) {
        // Rollback payment
        await stripe.refunds.create({ payment_intent: orderData.paymentId });
        throw new Error('Order creation failed after retries');
      }
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

### Fallback Plan

**Si la mitigación falla:**
1. [Paso 1 del fallback]
2. [Paso 2 del fallback]
3. [Notificación al usuario]

**Ejemplo:**
> 1. Automatic refund via Stripe API
> 2. Email notification to user explaining issue
> 3. Alert to support team for manual follow-up

---

## 📊 Monitoring & Detection

### Cómo detectar este edge case:

**Logs:**
```javascript
// Ejemplo de log entry
{
  "event": "PAYMENT_SUCCESS_ORDER_FAILED",
  "payment_id": "pi_xxx",
  "error": "Database timeout",
  "timestamp": "2026-01-27T14:30:00Z"
}
```

**Metrics:**
- Métrica a monitorear: [Nombre]
- Alert threshold: [Valor]
- Alert destination: [Sentry / PagerDuty / Email]

**Queries para detectar:**
```sql
-- Ejemplo
SELECT payment_intent_id
FROM stripe_payments
WHERE status = 'succeeded'
  AND payment_intent_id NOT IN (
    SELECT payment_intent_id FROM orders
  );
```

---

## 🧪 Testing Strategy

### Unit Tests

```javascript
describe('Edge Case: Payment Success but Order Fails', () => {
  it('should refund payment if order creation fails', async () => {
    // Mock database failure
    jest.spyOn(db, 'createOrder').mockRejectedValue(new Error('Timeout'));

    // Attempt order creation
    await expect(createOrderWithRetry(orderData)).rejects.toThrow();

    // Verify refund was issued
    expect(stripe.refunds.create).toHaveBeenCalled();
  });
});
```

### Integration Tests

[Describe integration test scenario]

### Manual Testing Steps

1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
4. **Expected Result:** [Qué debería pasar]

---

## 📝 Cambios en Documentación

### Documentos a Actualizar:

- [x] **04-edge-cases.md** - Agregar este edge case completo
- [ ] **05-testing-strategy.md** - Agregar tests específicos
- [ ] **07-monitoring.md** - Agregar métricas de detección
- [ ] **02-requirements.md** - Actualizar edge cases en RF-XXX
- [x] **CHANGELOG.md** - Agregar entry

### Entry en 04-edge-cases.md:

```markdown
### 🔴 EDGE CASE #4: [Título]

#### Scenario:
[Descripción paso a paso]

#### Impact:
[Impacto detallado]

#### Mitigation Strategy:
[Código y explicación]

#### Monitoring:
[Métricas y alerts]
```

---

## ✅ Acceptance Criteria

- [ ] Edge case documentado en 04-edge-cases.md
- [ ] Mitigation strategy implementada en código
- [ ] Unit tests agregados con >80% coverage
- [ ] Integration tests passing
- [ ] Monitoring configurado
- [ ] Alerts funcionando
- [ ] Manual testing completado
- [ ] CHANGELOG actualizado
- [ ] Asesor revisó y aprobó

---

## 🔗 Related Issues

**Related Edge Cases:**
- EC-001: Network Partition durante Order Placement
- EC-002: Concurrent Stock Updates

**Related Requirements:**
- RF-006: Pre-Order Placement

---

## 👥 Aprobaciones

| Rol | Nombre | Aprobado | Fecha |
|-----|--------|----------|-------|
| **Developer** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |
| **QA/Tester** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |
| **Asesor** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |

---

**Status:** Draft / In Review / Approved / Implemented
**Priority:** P0 / P1 / P2
**Last Updated:** YYYY-MM-DD
