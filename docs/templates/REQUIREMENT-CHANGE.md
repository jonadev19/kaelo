# Requirement Change Template

**ID:** RC-XXX
**Fecha:** YYYY-MM-DD

---

## 📋 Requirement Información

| Campo | Valor |
|-------|-------|
| **Requirement ID** | RF-XXX / RNF-XXX |
| **Requirement Actual** | [Nombre del requirement] |
| **Módulo** | User / Merchant / Admin |
| **Prioridad Actual** | P0 / P1 / P2 |

---

## 🔄 Tipo de Cambio

- [ ] Modificar requirement existente
- [ ] Agregar nuevo requirement
- [ ] Eliminar requirement
- [ ] Cambiar prioridad
- [ ] Actualizar acceptance criteria
- [ ] Agregar/modificar edge cases

---

## 📝 Detalle del Cambio

### Antes:

**RF-XXX:** [Nombre]
- **Priority:** P0
- **Acceptance Criteria:** [Criterios actuales]
- **Edge Cases:** [Edge cases actuales]

### Después:

**RF-XXX:** [Nombre modificado (si aplica)]
- **Priority:** P1 (si cambió)
- **Acceptance Criteria:** [Nuevos criterios]
- **Edge Cases:** [Nuevos edge cases]

---

## 🎯 Justificación

[Por qué este cambio es necesario?]

**Ejemplo:**
> Basado en feedback de beta testers, necesitamos agregar campo de "notas especiales" para que ciclistas puedan indicar restricciones dietéticas o alergias al pre-ordenar comida.

---

## 💥 Impact Assessment

### Secciones Afectadas

- [x] **02-requirements.md** - Actualizar tabla de requirements
- [ ] **03-architecture.md** - ¿Requiere cambio en data model?
- [ ] **04-edge-cases.md** - ¿Nuevos edge cases?
- [ ] **05-testing-strategy.md** - ¿Nuevos tests?
- [ ] **06-risk-management.md** - ¿Impacta timeline?
- [ ] **09-security.md** - ¿Implicaciones de seguridad?

### Impacto en Implementación

| Área | Impacto | Detalles |
|------|---------|----------|
| **Frontend** | ✅ Bajo / ⚠️ Medio / 🔴 Alto | [Explicar] |
| **Backend** | ✅ Bajo / ⚠️ Medio / 🔴 Alto | [Explicar] |
| **Database** | ✅ Bajo / ⚠️ Medio / 🔴 Alto | [Explicar] |
| **Testing** | ✅ Bajo / ⚠️ Medio / 🔴 Alto | [Explicar] |

---

## 📊 Ejemplo de Actualización

### En 02-requirements.md:

**Tabla 6.1 - User Module:**

```markdown
| ID | Requirement | Priority | Acceptance Criteria | Edge Cases |
|----|-------------|----------|---------------------|------------|
| RF-006 | Pre-Order Placement | P0 | Product selection + ETA + payment + **special notes** | Payment timeout, inventory sold out, **notes validation (max 200 chars)** |
```

**Nuevo Edge Case a agregar en 04-edge-cases.md:**

```markdown
### Edge Case: Special Notes Input Validation

**Scenario:**
User intenta agregar >200 caracteres en special notes field

**Mitigation:**
- Client-side: Max length validation
- Server-side: Truncate a 200 chars + warning
```

---

## ✅ Checklist de Implementación

- [ ] Actualizar tabla de requirements en 02-requirements.md
- [ ] Agregar edge cases en 04-edge-cases.md (si aplica)
- [ ] Actualizar data model en 03-architecture.md (si aplica)
- [ ] Agregar tests en 05-testing-strategy.md (si aplica)
- [ ] Revisar security implications en 09-security.md
- [ ] Actualizar CHANGELOG.md
- [ ] Obtener aprobación de asesor

---

## 👥 Aprobaciones

| Rol | Nombre | Aprobado | Fecha |
|-----|--------|----------|-------|
| **Desarrollador** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |
| **Asesor** | [Nombre] | ☐ Sí / ☐ No | YYYY-MM-DD |

---

**Status:** Pendiente / Aprobado / Rechazado / Implementado
**Last Updated:** YYYY-MM-DD
