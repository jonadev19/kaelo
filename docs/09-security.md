# 09 - Security & Legal

**Version:** 1.1
**Last Updated:** Enero 2026

## 17. SECURITY CONSIDERATIONS

### 17.1 Security Checklist

✅ **Authentication:** JWT-based con refresh token rotation
✅ **Authorization:** Row Level Security (RLS) policies en todas las tablas
✅ **Input Validation:** Zod schemas en frontend + backend
✅ **SQL Injection Prevention:** Parameterized queries (Supabase handles this)
✅ **XSS Prevention:** React Native auto-escaping
✅ **CSRF Protection:** SameSite cookies + CORS config
✅ **Rate Limiting:** Supabase built-in (1000 req/min per IP)
✅ **Secrets Management:** Environment variables (nunca en código)
✅ **Data Encryption:** TLS 1.3 in transit, AES-256 at rest
✅ **PII Protection:** GDPR-compliant (data deletion endpoints)

### 17.2 RLS Policy Examples

```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only create orders for themselves
CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Merchants can only view their own orders
CREATE POLICY "Merchants view own orders"
ON orders FOR SELECT
USING (
    merchant_id IN (
        SELECT id FROM merchants WHERE owner_id = auth.uid()
    )
);
```

### 17.3 Security Audit Plan

**Pre-Launch:**
- [ ] Dependency vulnerability scan (npm audit)
- [ ] OWASP Top 10 review
- [ ] Penetration testing (básico con OWASP ZAP)
- [ ] Code security review (SonarQube)
- [ ] Secrets scanning (git-secrets)

**Post-Launch:**
- [ ] Quarterly security audits
- [ ] Monthly dependency updates
- [ ] Continuous monitoring con Sentry

## 20. LEGAL & COMPLIANCE

### 20.1 Legal Requirements

#### 1. Términos de Servicio (ToS)
- Limitación de responsabilidad por información de rutas
- Política de cancelación de pedidos
- Comisiones para comercios (10% transaccional)

#### 2. Política de Privacidad
- Cumplimiento LFPDPPP (Ley Federal de Protección de Datos Personales)
- Consentimiento explícito para location tracking
- Derecho ARCO (Acceso, Rectificación, Cancelación, Oposición)

#### 3. Contratos de Afiliación
- Acuerdo comercial con merchants
- SLA (Service Level Agreement) básico
- Términos de pago (net-15 días)

### 20.2 Data Protection

| Data Type | Storage | Retention | Access |
|-----------|---------|-----------|--------|
| User Location | Solo durante ride activo (not persistent) | Session only | User only |
| Payment Data | Nunca almacenamos tarjetas (Stripe handles PCI compliance) | N/A | Stripe only |
| Personal Info | Encrypted at rest | 2 years after last activity | User + Admins (RLS) |
| Order History | Encrypted at rest | Permanent (audit) | User + Merchant |

### 20.3 GDPR-Style Compliance

**User Rights:**
- ✅ Right to Access: Export all user data (JSON format)
- ✅ Right to Rectification: Edit profile + preferences
- ✅ Right to Erasure: Delete account + anonymize orders
- ✅ Right to Data Portability: Download data in machine-readable format

**Implementation:**

```sql
-- Data deletion function
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize orders (keep for merchant records)
    UPDATE orders
    SET user_id = NULL,
        metadata = jsonb_set(metadata, '{anonymized}', 'true')
    WHERE user_id = target_user_id;

    -- Delete profile
    DELETE FROM profiles WHERE id = target_user_id;

    -- Delete auth user
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**Related Documents:**
- [03 - Architecture](./03-architecture.md)
- [07 - Monitoring](./07-monitoring.md)
- [10 - Deployment](./10-deployment.md)
