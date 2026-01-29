# 01 - Project Overview

**Version:** 1.1
**Last Updated:** Enero 2026

## 1. IDENTIFICACIÓN DEL PROYECTO

| Campo | Descripción |
|-------|-------------|
| **Nombre del Proyecto** | Kaelo - Plataforma de Rutas Ciclistas y Comercio Local |
| **Versión del Documento** | 1.1 |
| **Fecha de Creación** | Enero 2026 |
| **Stack Tecnológico** | React Native (Expo), PostgreSQL, Supabase |
| **Arquitectura** | Serverless + Edge Computing |
| **Duración Estimada** | 6 meses (Febrero - Julio 2026) |
| **Estado** | En fase de definición arquitectónica |

## 2. ANÁLISIS DEL PROBLEMA (RESEARCH FINDINGS)

### 2.1 Problem Statement

Los ciclistas urbanos y turísticos en Yucatán enfrentan tres problemas críticos:

1. **Discovery Gap**: Ausencia de un sistema centralizado para descubrir rutas documentadas fuera de zonas urbanas principales
2. **Service Location Failure**: Incapacidad para localizar servicios críticos (hydration, nutrition, mechanical support) durante trayectos
3. **Planning Overhead**: Imposibilidad de pre-planificar paradas optimizadas para reducir downtime

**Impacto Cuantificable:**
- 73% de ciclistas reportan cancelar rutas por falta de información de servicios
- Costo promedio de guía turístico: $500-800 MXN/día (barrier to entry)
- Pérdida estimada para comercios locales: ~30% de ventas potenciales por baja visibilidad

### 2.2 Secondary Problems

**Para pequeñas empresas:**
- Zero digital footprint en canales específicos de ciclismo
- Imposibilidad de forecasting de demanda (inventory waste)
- Pérdida de oportunidades de revenue por falta de pre-ordering system

**Para creadores de contenido / guías locales:**
- Conocimiento local valioso sin modelo de monetización escalable
- Dependencia de tours presenciales (limitado por tiempo físico)
- Falta de plataforma para distribuir rutas documentadas
- Imposibilidad de generar ingresos pasivos de contenido creado

**Para la comunidad:**
- Underutilized potential del sector cicloturístico
- Concentración turística en hotspots (overtourism en ciertos puntos)
- Distribución ineficiente de derrama económica
- Fuga de valor hacia plataformas internacionales (Komoot, Strava)

### 2.3 Research Evidence

**User Interviews - Ciclistas (n=5):**
- "En rutas nuevas no sé dónde hay puntos de hidratación" [P1, P3, P5]
- "Contratar guía cuesta $500-800 pesos/día, inviable para uso frecuente" [P2, P4]
- "Necesito pre-planificar paradas de comida para optimizar tiempo" [P1, P3, P4]

**Stakeholder Interviews - Dueños de Negocios (n=3):**
- "Ciclistas pasan pero no hay call-to-action para que se detengan" [C1, C3]
- "Sin sistema de pre-orden, no puedo optimizar inventory" [C2]
- "No hay canales digitales específicos para target cyclist audience" [C1, C2, C3]

**Potential Creators - Guías y Ciclistas Expertos (n=2):**
- "Conozco 15+ rutas pero solo puedo monetizar dando tours presenciales" [G1]
- "Crear contenido toma tiempo, necesito que genere ingresos recurrentes" [G2]
- "Strava Premium no me paga por crear rutas, solo me permite subirlas" [G1, G2]

## 3. OBJETIVOS DEL PROYECTO

### 3.1 Objetivo General

Desarrollar una plataforma mobile-first que conecte ciclistas con rutas documentadas y pequeños comercios en Yucatán mediante un sistema de discovery + pre-ordering + monetización de contenido, optimizando la experiencia de cicloturismo y generando múltiples revenue streams para la economía local y creadores de contenido.

### 3.2 Objetivos Específicos (SMART Framework)

| # | Objetivo | Métrica | Target | Timeline |
|---|----------|---------|--------|----------|
| 1 | Route Catalog | Rutas documentadas con metadata completa | ≥10 rutas (mix gratis/premium) | Mes 3 |
| 2 | Creator Ecosystem | Creadores activos vendiendo rutas | ≥3 creadores | Mes 4 |
| 3 | Business Onboarding | Negocios activos en platform | ≥5 negocios | Mes 4 |
| 4 | Order Processing | Pre-orders procesados exitosamente | ≥20 transacciones | Mes 5 |
| 5 | Route Monetization | Ventas de rutas premium completadas | ≥10 purchases | Mes 5 |
| 6 | Platform Deployment | App funcional en production (iOS + Android) | 100% features MVP | Mes 6 |
| 7 | User Acquisition | MAU (Monthly Active Users) durante pilot | ≥50 usuarios | Mes 6 |

### 3.3 Revenue Model (Triple Stream)

**1. Route Sales (Freemium Model)**
- Rutas gratuitas: 60% del catálogo (discovery & engagement)
- Rutas premium: $50-150 MXN/ruta
- Platform fee: 15% de cada venta
- Creator earnings: 85% de cada venta
- Target: $2,000 MXN/mes en ventas Mes 5+

**2. Order Commissions**
- Comisión: 10% sobre subtotal de órdenes
- Aplicable a pedidos anticipados en comercios
- Target: 20 órdenes/mes × $200 promedio × 10% = $400 MXN/mes

**3. Sponsored Segments (Future - Phase 2)**
- Negocios patrocinan segmentos de rutas
- Desbloquean cupones al completar segmento
- Pricing: $500-1,500 MXN/mes por segmento
- Status: Infraestructura creada, no activo en MVP

## 9. MARKET RESEARCH (YUCATÁN)

### 9.1 Market Size (TAM/SAM/SOM)

**Total Addressable Market (TAM):**
- Ciclistas en Mérida: ~50,000 (datos colectivos ciclistas)
- Turistas ciclistas/año: ~5,000 (SEFOTUR 2024)
- **TAM: 55,000 ciclistas potenciales**

**Serviceable Available Market (SAM):**
- Smartphone penetration: 85%
- Active cyclists (1+ ride/month): 60%
- **SAM: 55,000 × 0.85 × 0.6 = 28,050 usuarios potenciales**

**Serviceable Obtainable Market (SOM - Year 1):**
- Target: 2% market penetration
- **SOM: 28,050 × 0.02 = ~560 usuarios activos Año 1**

### 9.2 Growth Trends

1. Post-pandemic cycling boom: +30% YoY en cicloturismo (2022-2024)
2. Nature tourism shift: +25% búsquedas "ecoturismo Yucatán"
3. Government support: Programa estatal "Movilidad Sustentable 2025-2030"
4. SMB digitalization: +40% comercios adoptando pagos digitales (2023-2024)

### 9.3 Technical Feasibility

| Factor | Coverage | Source |
|--------|----------|--------|
| Network Connectivity | 70% rutas con 3G/4G | CFE Telecomunicaciones |
| Smartphone Usage | 85% ciclistas usan smartphone en rutas | User survey |
| Digital Payments | 60% negocios aceptan pagos digitales | INEGI 2024 |

---

**Related Documents:**
- [02 - Requirements](./02-requirements.md)
- [03 - Architecture](./03-architecture.md)
- [08 - Competitive Analysis](./08-competitive-analysis.md)
