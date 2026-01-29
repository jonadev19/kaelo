# 11 - Budget & Resources

**Version:** 1.1
**Last Updated:** Enero 2026

## 18. BUDGET & RESOURCE PLANNING

### 18.1 Infrastructure Costs (Monthly)

| Service | Tier | Cost (USD) | Cost (MXN @ 17:1) | Notes |
|---------|------|------------|-------------------|-------|
| Supabase | Pro | $25 | $425 | 8GB database, 100GB bandwidth |
| Mapbox | Pay-as-you-go | $5 | $85 | <50k MAU gratis, luego $0.05/1k |
| Stripe | Pay-as-you-go | 2.9% + $0.30/tx | Variable | ~$20 en 100 transacciones |
| Sentry | Team | $26 | $442 | 100k events/month |
| Vercel | Hobby | $0 | $0 | Sufficient para MVP |
| Domain | .app | $12/year | $204/year | Namecheap |
| **Total Mensual** | - | **~$76** | **~$1,292** | |
| **Total Anual (Year 1)** | - | **~$912** | **~$15,504** | |

### 18.2 One-Time Costs

| Item | Cost (USD) | Cost (MXN) | Notes |
|------|------------|------------|-------|
| Apple Developer Account | $99/year | $1,683 | Required para iOS |
| Google Play Console | $25 (one-time) | $425 | Required para Android |
| Figma Pro | $0 | $0 | Educational license |
| **Total One-Time** | **$124** | **$2,108** | |

### 18.3 Total Budget Summary

**Total Budget Year 1:** ~$1,036 USD (~$17,612 MXN)

**Breakdown:**
- Infrastructure (monthly): $912 USD
- One-time costs: $124 USD
- **Contingency (10%)**: ~$100 USD

### 18.4 Cost Optimization Strategies

#### Free Tier Maximization
- **Supabase:** Stay under 8GB database (monitor usage)
- **Mapbox:** Cache tiles aggressively, use <50k MAU
- **Vercel:** Hobby tier sufficient until 100GB bandwidth
- **Sentry:** Filter noise events, stay under 100k/month

#### Scale-Up Triggers

| Metric | Free/Current Tier | Upgrade Trigger | New Tier | Additional Cost |
|--------|------------------|-----------------|----------|----------------|
| Supabase DB | 8GB | >6GB used | Pro+ ($99/mo) | +$74/mo |
| Mapbox MAU | 50k | >45k MAU | Pay tier | +$50/mo |
| Sentry Events | 100k | >80k/mo | Business | +$63/mo |

### 18.5 Revenue Projections (Optional)

**Assumptions:**
- 50 MAU by Month 6
- 20 orders/month
- $150 MXN average order value
- 10% platform commission

**Projected Revenue (Month 6):**
- Total GMV: 20 orders × $150 = $3,000 MXN
- Platform Revenue (10%): $300 MXN (~$18 USD)

**Break-Even Analysis:**
- Monthly costs: ~$76 USD
- Orders needed to break even: ~422 orders/month
- Timeline to break even: Month 12-18 (estimated)

> **Note:** This is an academic project. Revenue generation is not the primary goal during MVP phase.

---

**Related Documents:**
- [01 - Project Overview](./01-project-overview.md)
- [06 - Risk Management](./06-risk-management.md)
- [10 - Deployment](./10-deployment.md)
