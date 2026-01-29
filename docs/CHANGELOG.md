# CHANGELOG - Kaelo Documentación

Todos los cambios notables a este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Planned
- Implementación completa de sistema modular
- Migración a Git para control de versiones

---

## [1.3] - 2026-01-28

### Added
- **RF-015**: Activity Tracking - registro automático de métricas durante navegación (P1)
- **RF-016**: Personal Dashboard - visualización de métricas agregadas del usuario (P1)
- **RF-017**: Activity History - historial cronológico de rutas completadas (P1)
- **RF-018**: Performance Comparison - comparación vs recorridos anteriores (P2)
- **RF-019**: Personal Records - récords personales del ciclista (P2)
- **Nueva tabla `user_activities`**: almacenamiento de historial de recorridos con métricas GPS
- MVP Scope ampliado para incluir Personal Metrics Dashboard

### Changed
- Updated document version: 1.2 → 1.3
- Ciclistas Locales stakeholder value proposition ahora incluye "personal progress tracking"

### Justification
- Métricas personales identificadas como gap crítico vs competencia (Strava)
- Diferenciación de Kaelo: discovery + commerce + personal tracking
- Aumenta engagement y retención de usuarios
- Proporciona valor adicional sin requerir wearable integrations

---

## [1.2] - 2026-01-28

### Added
- **RF-009**: Push Notifications para order status updates (P0)
- **RF-010**: User Location Tracking para navegación en tiempo real (P0)
- **RF-011**: Route Search por nombre o ubicación (P0)
- **RF-012**: Order Cancellation con refund antes de "preparing" (P0)
- **RF-013**: Favorite Routes para acceso rápido (P1)
- **RF-014**: Cash Payment Option - pago en punto de recogida (P1)
- **RF-106**: Order Notifications para comerciantes (P0)
- **RF-107**: Payment Method Settings para comerciantes (P0)
- **RF-108**: Order Contact Info para coordinación (P0)
- **Requisitos No Funcionales**:
  - Push notification delivery: <30s
  - GPS accuracy: <20m error radius
  - Search response: <1s
  - Notification delivery rate: >95%

### Changed
- Updated MVP Scope para incluir notificaciones push y geolocalización
- Expanded technical capabilities con Expo Notifications
- Updated document version: 1.1 → 1.2

### Justification
- Timeline ajustado a 6 semanas requiere priorización crítica
- Notificaciones son esenciales para flujo de órdenes
- Geolocalización es core feature para app de cicloturismo
- Búsqueda mejora usabilidad significativamente
- Opción de efectivo amplía accesibilidad (no todos tienen tarjeta)

---

## [1.1] - 2026-01-27

### Added
- **Detailed edge cases analysis** (Sección 11)
  - Network partition durante order placement
  - Concurrent stock updates (race condition)
  - Offline-first sync conflicts
- **Enhanced testing strategy** (Sección 14)
  - Test pyramid con coverage targets
  - Unit test examples
  - Integration test examples
- **Security considerations** (Sección 17)
  - Security checklist completo
  - RLS policy examples
  - GDPR compliance guidelines
- **Budget breakdown** (Sección 18)
  - Monthly infrastructure costs
  - One-time costs
  - Break-even analysis

### Changed
- Reorganized document structure para mejor navegación
- Updated technical stack con versiones específicas
- Expanded competitive analysis con feature comparison matrix

### Fixed
- N/A

---

## [1.0] - 2026-01-20

### Added
- **Initial Release** - Full project specification
- Project identification y problem statement
- SMART objectives framework
- Functional requirements (User, Merchant, Admin modules)
- Non-functional requirements con monitoring strategy
- System architecture diagrams
- Data model con PostgreSQL/PostGIS schemas
- Stakeholder analysis
- Competitive analysis
- Market research (TAM/SAM/SOM)
- Risk management matrix
- Gantt chart (6-month timeline)
- Legal & compliance section

---

## Formato de Entradas

Usa este formato para nuevos cambios:

```markdown
## [X.Y] - YYYY-MM-DD

### Added
- Nueva funcionalidad o sección agregada

### Changed
- Cambios en funcionalidad existente
- Actualizaciones de valores/métricas

### Deprecated
- Funcionalidades marcadas para remover en futuras versiones

### Removed
- Funcionalidades removidas

### Fixed
- Correcciones de bugs o errores

### Security
- Cambios relacionados con seguridad
```

---

## Tipos de Cambios

- **Added**: para nuevas funcionalidades
- **Changed**: para cambios en funcionalidad existente
- **Deprecated**: para funcionalidades que pronto serán removidas
- **Removed**: para funcionalidades removidas
- **Fixed**: para correcciones de bugs
- **Security**: en caso de vulnerabilidades

---

## Versionado Semántico

- **MAJOR (X.0.0)**: Cambios incompatibles en la API o arquitectura fundamental
- **MINOR (1.X.0)**: Nuevas funcionalidades compatibles con versión anterior
- **PATCH (1.0.X)**: Correcciones de bugs compatibles con versión anterior

**Ejemplo:**
- `1.0.0` → `1.1.0`: Agregar nueva sección (edge cases)
- `1.1.0` → `1.1.1`: Corregir typo en requirement
- `1.1.0` → `2.0.0`: Cambiar stack tecnológico completamente
