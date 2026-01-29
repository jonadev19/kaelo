# Metric Change Template

**ID:** MC-XXX
**Fecha:** YYYY-MM-DD

---

## 📊 Metric Información

| Campo | Valor |
|-------|-------|
| **Metric Name** | [Nombre de la métrica] |
| **Category** | SLI / KPI / Performance / Business |
| **Documento Afectado** | 07-monitoring.md / 06-risk-management.md |

---

## 🔄 Tipo de Cambio

- [ ] Cambiar target/threshold
- [ ] Agregar nueva métrica
- [ ] Eliminar métrica
- [ ] Cambiar herramienta de medición
- [ ] Actualizar estrategia de alerting

---

## 📝 Detalle del Cambio

### Antes:

| Métrica | Target Actual | Alert Threshold | Tool |
|---------|---------------|-----------------|------|
| [Nombre] | [Valor] | [Valor] | [Tool] |

**Ejemplo:**
| API Latency (P95) | <500ms | >1s | Supabase Logs |

### Después:

| Métrica | Target Nuevo | Alert Threshold Nuevo | Tool |
|---------|--------------|----------------------|------|
| [Nombre] | [Valor] | [Valor] | [Tool] |

**Ejemplo:**
| API Latency (P95) | <300ms | >600ms | Supabase Logs + Sentry |

---

## 🎯 Justificación

[Por qué este cambio es necesario?]

**Ejemplo:**
> Basado en testing, nuestras queries PostGIS son más rápidas de lo estimado. Podemos ofrecer mejor UX con target más agresivo de <300ms.

**O bien:**
> Durante load testing descubrimos que Mapbox queries agregan overhead. Necesitamos relajar target de <500ms → <600ms.

---

## 💥 Impact Analysis

### Secciones Afectadas

- [ ] **02-requirements.md** - Si es requirement no-funcional
- [ ] **06-risk-management.md** - Si es KPI crítico
- [ ] **07-monitoring.md** - SIEMPRE si es SLI
- [ ] **CHANGELOG.md** - SIEMPRE

### Impacto en Sistema

| Área | Impacto | Detalles |
|------|---------|----------|
| **Performance** | Mejora / Sin cambio / Degrada | [Explicar] |
| **Alerting** | Más alerts / Menos alerts / Sin cambio | [Explicar] |
| **SLA** | Mejora / Sin cambio / Degrada | [Explicar] |
| **User Experience** | Mejora / Sin cambio / Degrada | [Explicar] |

---

## 📋 Cambios en Documentación

### 1. Actualizar 07-monitoring.md

**Sección 16.1 - Key Metrics (SLIs):**

```markdown
| Metric | Target | Alerting Threshold | Tool |
|--------|--------|-------------------|------|
| API Latency (P95) | <300ms | >600ms | Supabase Logs + Sentry |
```

### 2. Actualizar 02-requirements.md (si aplica)

**Sección 7 - Requerimientos No Funcionales:**

```markdown
| Categoría | Requirement | Métrica | Target | Monitoring Strategy |
|-----------|-------------|---------|--------|---------------------|
| Performance | API Response Time | P95 latency | <300ms | Supabase Logs + Sentry |
```

### 3. Actualizar CHANGELOG.md

```markdown
## [1.X] - YYYY-MM-DD

### Changed
- API latency target: <500ms → <300ms (P95)
- Alert threshold: >1s → >600ms
- Monitoring tool: Added Sentry alongside Supabase Logs
```

---

## 🔔 Alerting Configuration

### Configuración Actual:
```javascript
// Ejemplo
if (latency > 1000) {
  alert('API latency exceeds 1s');
}
```

### Configuración Nueva:
```javascript
// Ejemplo
if (latency > 600) {
  alert('API latency exceeds 600ms');
}
```

---

## ✅ Checklist de Implementación

- [ ] Actualizar tabla de métricas en 07-monitoring.md
- [ ] Actualizar requirements en 02-requirements.md (si aplica)
- [ ] Actualizar KPIs en 06-risk-management.md (si aplica)
- [ ] Configurar nuevos alerts en herramienta de monitoring
- [ ] Actualizar CHANGELOG.md
- [ ] Testear que alerts funcionan correctamente
- [ ] Documentar cambio en retrospective

---

## 📊 Historical Context

**Razón del cambio original:**
[Por qué se estableció el target anterior?]

**Data que soporta el cambio:**
- Métrica actual promedio: [Valor]
- P50: [Valor]
- P95: [Valor]
- P99: [Valor]

**Ejemplo:**
> Durante los últimos 30 días:
> - P50: 180ms
> - P95: 420ms
> - P99: 650ms
>
> Podemos bajar target de 500ms → 300ms con confianza.

---

## 👥 Aprobaciones

| Rol | Nombre | Aprobado | Fecha |
|-----|--------|----------|-------|
| **Developer** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |
| **Asesor** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |

---

**Status:** Pendiente / Aprobado / Implementado
**Last Updated:** YYYY-MM-DD
