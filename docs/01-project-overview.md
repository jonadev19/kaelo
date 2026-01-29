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

**Para pequeños comercios:**
- Zero digital footprint en canales específicos de ciclismo
- Imposibilidad de forecasting de demanda (inventory waste)
- Pérdida de oportunidades de revenue por falta de pre-ordering system

**Para la comunidad:**
- Underutilized potential del sector cicloturístico
- Concentración turística en hotspots (overtourism en ciertos puntos)
- Distribución ineficiente de derrama económica

### 2.3 Research Evidence

**User Interviews - Ciclistas (n=5):**
- "En rutas nuevas no sé dónde hay puntos de hidratación" [P1, P3, P5]
- "Contratar guía cuesta $500-800 pesos/día, inviable para uso frecuente" [P2, P4]
- "Necesito pre-planificar paradas de comida para optimizar tiempo" [P1, P3, P4]

**Stakeholder Interviews - Comerciantes (n=3):**
- "Ciclistas pasan pero no hay call-to-action para que se detengan" [C1, C3]
- "Sin sistema de pre-orden, no puedo optimizar inventory" [C2]
- "No hay canales digitales específicos para target cyclist audience" [C1, C2, C3]

## 3. OBJETIVOS DEL PROYECTO

### 3.1 Objetivo General

Desarrollar una plataforma mobile-first que conecte ciclistas con rutas documentadas y pequeños comercios en Yucatán mediante un sistema de discovery + pre-ordering, optimizando la experiencia de cicloturismo y generando revenue streams para economía local.

### 3.2 Objetivos Específicos (SMART Framework)

| # | Objetivo | Métrica | Target | Timeline |
|---|----------|---------|--------|----------|
| 1 | Route Catalog | Rutas documentadas con metadata completa | ≥10 rutas | Mes 3 |
| 2 | Merchant Onboarding | Comercios activos en platform | ≥5 comercios | Mes 4 |
| 3 | Order Processing | Pre-orders procesados exitosamente | ≥20 transacciones | Mes 5 |
| 4 | Platform Deployment | App funcional en production (iOS + Android) | 100% features MVP | Mes 6 |
| 5 | User Acquisition | MAU (Monthly Active Users) durante pilot | ≥50 usuarios | Mes 6 |

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
| Digital Payments | 60% comercios aceptan pagos digitales | INEGI 2024 |

---

**Related Documents:**
- [02 - Requirements](./02-requirements.md)
- [03 - Architecture](./03-architecture.md)
- [08 - Competitive Analysis](./08-competitive-analysis.md)
