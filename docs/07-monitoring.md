# 07 - Monitoring & Observability

**Version:** 1.1
**Last Updated:** Enero 2026

## 16. MONITORING & OBSERVABILITY

### 16.1 Key Metrics (SLIs)

| Metric | Target | Alerting Threshold | Tool |
|--------|--------|-------------------|------|
| API Latency (P95) | <500ms | >1s | Supabase Logs |
| Error Rate | <1% | >2% | Sentry |
| App Crash Rate | <0.5% | >1% | Sentry |
| Order Success Rate | >95% | <90% | Custom analytics |
| Payment Success Rate | >98% | <95% | Stripe Dashboard |
| Uptime | >99.5% | <99% | UptimeRobot |

### 16.2 Alerting Strategy

```javascript
// Example: Custom metric tracking
import * as Sentry from '@sentry/react-native';

export const trackOrderMetric = (event: string, properties: object) => {
    // Send to analytics
    analytics.track(event, properties);

    // Send to Sentry for error correlation
    Sentry.addBreadcrumb({
        category: 'order',
        message: event,
        level: 'info',
        data: properties
    });

    // Alert on critical failures
    if (event === 'ORDER_CREATION_FAILED') {
        Sentry.captureException(new Error('Order creation pipeline failed'), {
            tags: { severity: 'critical' },
            extra: properties
        });
    }
};
```

### 16.3 Monitoring Dashboards

#### Production Health Dashboard
- Real-time API latency (P50, P95, P99)
- Error rate per endpoint
- Active users (last 5 min, last hour, last 24h)
- Order funnel conversion (view → cart → checkout → payment)
- Database connection pool status
- Cache hit rate

#### Business Metrics Dashboard
- GMV (Gross Merchandise Value) - daily/weekly/monthly
- Orders per merchant (ranking)
- Popular routes (by downloads)
- User retention cohorts
- Revenue by category

### 16.4 Log Aggregation

**Structured Logging Format:**

```javascript
// Example log entry
{
    "timestamp": "2026-01-27T14:30:00Z",
    "level": "error",
    "service": "mobile-app",
    "user_id": "uuid-123",
    "event": "payment_failed",
    "context": {
        "order_id": "uuid-456",
        "merchant_id": "uuid-789",
        "error_code": "card_declined",
        "payment_gateway": "stripe"
    },
    "metadata": {
        "app_version": "1.0.0",
        "platform": "ios",
        "os_version": "16.3"
    }
}
```

### 16.5 Performance Monitoring

**Key Performance Indicators:**

- **Time to Interactive (TTI)**: <3s para home screen
- **First Contentful Paint (FCP)**: <1.5s
- **Map Load Time**: <2s para route detail
- **API Response Time**: P95 <500ms
- **Database Query Time**: P95 <100ms

**Performance Budget:**
- Bundle size: <10MB total
- Image assets: <500KB per route
- Map tiles: <50MB offline cache per route

---

**Related Documents:**
- [06 - Risk Management](./06-risk-management.md)
- [09 - Security](./09-security.md)
- [10 - Deployment](./10-deployment.md)
