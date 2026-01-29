# 📊 Impact Matrix - Kaelo Documentation

**Version:** 1.0
**Last Updated:** 2026-01-27

## Purpose

Esta matriz te ayuda a identificar **qué documentos debes actualizar** cuando realizas un cambio específico.

---

## 🔍 How to Use

1. Identifica el tipo de cambio que vas a realizar (fila)
2. Mira las columnas marcadas con ✅ o ⚠️
3. Actualiza todos los documentos marcados

**Leyenda:**
- ✅ **Requiere actualización** - Debes modificar este documento
- ⚠️ **Revisar si es necesario** - Puede requerir cambios dependiendo del contexto
- ❌ **Sin impacto** - No requiere cambios

---

## Matrix

| Tipo de Cambio | Overview | Requirements | Architecture | Edge Cases | Testing | Risk Mgmt | Monitoring | Competitive | Security | Deployment | Budget |
|----------------|----------|--------------|--------------|------------|---------|-----------|------------|-------------|----------|------------|--------|
| **Nueva métrica SLI** | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Nuevo endpoint API** | ❌ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ❌ | ✅ | ⚠️ | ❌ |
| **Cambiar DB schema** | ❌ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ⚠️ | ❌ |
| **Actualizar costos** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Nuevo edge case** | ❌ | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ |
| **Cambiar tech stack** | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| **Nuevo requirement** | ❌ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| **Modificar timeline** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| **Agregar competidor** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Nueva herramienta monitoring** | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| **Cambiar payment gateway** | ❌ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ⚠️ | ⚠️ |
| **Nuevo riesgo identificado** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | ⚠️ |
| **Modificar KPI target** | ❌ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cambiar deployment strategy** | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ | ❌ |
| **Actualizar legal/compliance** | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Agregar Nueva Métrica SLI

**Cambio:** Agregar "Database Query Time" como nueva métrica (P95 <100ms)

**Documentos a actualizar:**
- ✅ [07-monitoring.md](./07-monitoring.md) - Agregar métrica a tabla de SLIs
- ⚠️ [06-risk-management.md](./06-risk-management.md) - Considerar si afecta KPIs

**Proceso:**
1. Editar `07-monitoring.md` → Agregar nueva fila en tabla 16.1
2. Revisar `06-risk-management.md` → ¿Es este un KPI crítico?
3. Actualizar `CHANGELOG.md` → Agregar entrada en "Added"

---

### Ejemplo 2: Cambiar Database Schema

**Cambio:** Agregar columna `special_notes` en tabla `order_items`

**Documentos a actualizar:**
- ✅ [03-architecture.md](./03-architecture.md) - Actualizar SQL schema
- ✅ [05-testing-strategy.md](./05-testing-strategy.md) - Agregar tests para nuevo campo
- ✅ [09-security.md](./09-security.md) - Verificar RLS policies
- ⚠️ [02-requirements.md](./02-requirements.md) - ¿Requiere cambio en RF-006?
- ⚠️ [04-edge-cases.md](./04-edge-cases.md) - ¿Afecta edge cases de orders?
- ⚠️ [06-risk-management.md](./06-risk-management.md) - ¿Impacta timeline?
- ⚠️ [07-monitoring.md](./07-monitoring.md) - ¿Nuevas métricas a monitorear?
- ⚠️ [10-deployment.md](./10-deployment.md) - ¿Requiere migration script?

**Proceso:**
1. Actualizar schema en `03-architecture.md`
2. Agregar migration script en deployment section
3. Actualizar tests en `05-testing-strategy.md`
4. Revisar RLS en `09-security.md`
5. Considerar si requiere cambios en otros docs (⚠️)
6. Actualizar `CHANGELOG.md`

---

### Ejemplo 3: Actualizar Costos de Infraestructura

**Cambio:** Supabase aumenta precio de $25 → $30/mes

**Documentos a actualizar:**
- ✅ [11-budget.md](./11-budget.md) - Actualizar tabla de costos
- ⚠️ [01-project-overview.md](./01-project-overview.md) - Si afecta viabilidad del proyecto
- ⚠️ [06-risk-management.md](./06-risk-management.md) - Si afecta break-even analysis

**Proceso:**
1. Editar `11-budget.md` → Cambiar $25 a $30 en tabla 18.1
2. Recalcular "Total Mensual" y "Total Anual"
3. Revisar si afecta viabilidad en overview
4. Actualizar `CHANGELOG.md` → "Changed"

---

## 🎯 Decision Tree

```
┌─────────────────────────────────┐
│ ¿Qué tipo de cambio es?         │
└────────────┬────────────────────┘
             │
     ┌───────┴────────┐
     │                │
  Técnico        No-Técnico
     │                │
     │          ┌─────┴─────┐
     │          │           │
     │      Business    Documentation
     │          │           │
     │          │      Simple edit
     │          │      → 1 archivo
┌────┴────┐     │
│         │     │
API/DB   UI/UX  Costs/Timeline
│         │     │
├─ Requirements  └─ Budget
├─ Architecture    └─ Risk Mgmt
├─ Edge Cases
├─ Testing
├─ Security
└─ Deployment
```

---

## 📋 Checklist Template

Usa este checklist cuando hagas un cambio:

```markdown
## Change Impact Checklist

**Change Description:** [Descripción breve]
**Change Type:** [API/DB/UI/Costs/etc.]
**Date:** YYYY-MM-DD

### Documents to Update:
- [ ] 01-project-overview.md - Reason: ___________
- [ ] 02-requirements.md - Reason: ___________
- [ ] 03-architecture.md - Reason: ___________
- [ ] 04-edge-cases.md - Reason: ___________
- [ ] 05-testing-strategy.md - Reason: ___________
- [ ] 06-risk-management.md - Reason: ___________
- [ ] 07-monitoring.md - Reason: ___________
- [ ] 08-competitive-analysis.md - Reason: ___________
- [ ] 09-security.md - Reason: ___________
- [ ] 10-deployment.md - Reason: ___________
- [ ] 11-budget.md - Reason: ___________
- [ ] CHANGELOG.md - ✅ ALWAYS UPDATE

### Impact Assessment:
- Breaking change? Yes/No
- Affects timeline? Yes/No
- Requires testing? Yes/No
- Security implications? Yes/No

### Reviewer: ___________
### Approved: ___________
```

---

**Last Updated:** 2026-01-27
