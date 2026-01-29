# 10 - Deployment Strategy

**Version:** 1.1
**Last Updated:** Enero 2026

## 15. DEPLOYMENT STRATEGY

### 15.1 Environment Setup

| Environment | Purpose | Database | URL | Access |
|-------------|---------|----------|-----|--------|
| **Development** | Local dev | Local Postgres | localhost:3000 | Dev only |
| **Staging** | Pre-prod testing | Supabase (staging) | staging.kaeloruta.app | Dev + Testers |
| **Production** | Live app | Supabase (prod) | app.kaeloruta.app | Public |

### 15.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/mobile-deploy.yml
name: Mobile App Deploy

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd mobile && npm ci
      - run: npm run test:coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && eas build --platform android --non-interactive
      - run: eas submit -p android --latest

  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && eas build --platform ios --non-interactive
      - run: eas submit -p ios --latest

  deploy-dashboard:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd dashboard && npm ci && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 15.3 Rollback Strategy

| Component | Rollback Method | Time to Rollback |
|-----------|-----------------|------------------|
| **Mobile App** | EAS Updates (instant rollback sin re-submission a stores) | <5 min |
| **Backend** | Supabase branching para database rollbacks | <10 min |
| **Dashboard** | Vercel instant rollback via UI | <2 min |

### 15.4 Deployment Checklist

#### Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API rate limits configured
- [ ] Monitoring dashboards ready
- [ ] Rollback plan documented

#### Deployment Day
- [ ] Deploy to staging first
- [ ] Smoke tests on staging
- [ ] Stakeholder approval
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor error rates (first 30 min)
- [ ] Test critical user journeys

#### Post-Deployment
- [ ] Monitor metrics for 24h
- [ ] Review error logs
- [ ] Check performance dashboards
- [ ] Collect user feedback
- [ ] Document lessons learned

### 15.5 App Store Submission

#### iOS (App Store)
**Requirements:**
- Apple Developer Account ($99/year)
- App Store screenshots (6.5", 5.5")
- App icon (1024x1024px)
- Privacy policy URL
- Support URL

**Timeline:**
- Submission → Review: 24-48 hours
- Review → Approval: 1-3 days
- Total: 2-5 days

#### Android (Google Play)
**Requirements:**
- Google Play Console ($25 one-time)
- Feature graphic (1024x500px)
- Screenshots (min 2)
- Content rating questionnaire
- Privacy policy URL

**Timeline:**
- Submission → Review: Typically <24 hours
- Auto-approval in most cases

---

**Related Documents:**
- [03 - Architecture](./03-architecture.md)
- [05 - Testing Strategy](./05-testing-strategy.md)
- [07 - Monitoring](./07-monitoring.md)
