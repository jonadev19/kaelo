# 06 - Risk Management

**Version:** 1.1
**Last Updated:** Enero 2026

## 12. PLAN DE TRABAJO (GANTT SIMPLIFICADO)

| Fase | Duración | Semanas | Entregables Clave | Owner |
|------|----------|---------|-------------------|-------|
| **Phase 1: Foundation** | 4 semanas | 1-4 | • Arquitectura documentada<br>• DB schema finalized<br>• Supabase project setup<br>• Design system (Figma) | Dev + Asesor |
| **Phase 2: Backend Core** | 6 semanas | 5-10 | • Auth flow implemented<br>• API endpoints (CRUD)<br>• PostGIS queries working<br>• Edge functions deployed | Dev |
| **Phase 3: Mobile App** | 6 semanas | 11-16 | • Route discovery screen<br>• Order flow completo<br>• Offline functionality<br>• Payment integration | Dev |
| **Phase 4: Merchant Dashboard** | 3 semanas | 17-19 | • PWA funcional<br>• Order management<br>• Analytics básicas | Dev |
| **Phase 5: Testing & QA** | 3 semanas | 20-22 | • Unit tests (80% coverage)<br>• Integration tests<br>• Beta testing con 10 users | Dev + Testers |
| **Phase 6: Deployment** | 2 semanas | 23-24 | • App Store submission<br>• Production deployment<br>• Monitoring setup | Dev |
| **Phase 7: Documentation** | 2 semanas | 24-26 | • Technical docs<br>• User manuals<br>• Thesis writing | Dev |

**Critical Path:** Phase 2 → Phase 3 → Phase 5 (any delay impacts timeline)

### Sprint Planning:
- 2-week sprints
- Weekly demo con asesor (Fridays)
- Daily standup (async via Slack/Discord)

## 13. RISK MANAGEMENT MATRIX

| Riesgo | Probabilidad | Impacto | Score | Estrategia de Mitigación | Owner |
|--------|--------------|---------|-------|-------------------------|-------|
| **Falta de comercios afiliados** | 🟡 Medium (40%) | 🔴 High | 12 | • Early outreach (2 months before launch)<br>• Offer 0% commission first 3 months<br>• Partnership con cámara de comercio | Dev |
| **GPS offline performance issues** | 🟡 Medium (30%) | 🟡 Medium | 9 | • Extensive testing con diferentes devices<br>• Fallback a OpenStreetMap tiles<br>• Offline mode tutorial | Dev |
| **Baja adopción de ciclistas** | 🟢 Low (20%) | 🔴 High | 8 | • Partnership con 3 colectivos ciclistas<br>• Launch event + promo codes<br>• Referral program (invite friends) | Marketing |
| **Mapbox API rate limits** | 🟡 Medium (35%) | 🟡 Medium | 10 | • Implement tile caching<br>• Fallback a Mapbox free tier alternatives<br>• Monitor usage dashboard | Dev |
| **Payment gateway failures** | 🟢 Low (15%) | 🔴 High | 7 | • Dual provider (Stripe + MercadoPago)<br>• Retry logic con exponential backoff<br>• Cash payment fallback | Dev |
| **Database performance degradation** | 🟢 Low (10%) | 🟡 Medium | 5 | • Index optimization<br>• Query performance monitoring<br>• Connection pooling config | Dev |
| **Supabase service outage** | 🟢 Low (5%) | 🔴 High | 5 | • Implement health checks<br>• Graceful degradation<br>• Status page monitoring | Dev |
| **Scope creep (feature requests)** | 🔴 High (60%) | 🟡 Medium | 18 | • Strict MVP definition<br>• Feature backlog (Phase 2)<br>• Weekly priority review con asesor | Dev + Asesor |

### Risk Monitoring:
- Weekly risk review en standup
- **Red flags:** Score >12 = immediate action required
- Update matrix after cada sprint retrospective

## 19. SUCCESS METRICS (KPIs)

| KPI | Target (Month 6) | Measurement Method |
|-----|-----------------|-------------------|
| MAU (Monthly Active Users) | 50 ciclistas | Supabase Analytics |
| Active Merchants | 5 comercios | Database count |
| Order Volume | 20 orders | Database query |
| Order Completion Rate | >85% | Completed / Total orders |
| Average Order Value | $150 MXN | SUM(total) / COUNT(orders) |
| User Retention (Day 7) | >40% | Cohort analysis |
| App Store Rating | >4.0 ⭐ | App Store Connect |
| NPS Score | >50 | In-app survey |

---

**Related Documents:**
- [05 - Testing Strategy](./05-testing-strategy.md)
- [07 - Monitoring](./07-monitoring.md)
- [11 - Budget](./11-budget.md)
