# 05 - Testing Strategy

**Version:** 1.1
**Last Updated:** Enero 2026

## 14. TESTING STRATEGY

### 14.1 Test Pyramid

```
         /\
        /E2E\    10% - End-to-End (Critical flows)
       /------\
      / INT  \   30% - Integration (API + DB)
     /----------\
    / UNIT    \  60% - Unit (Business logic)
   /--------------\
```

### 14.2 Test Coverage Targets

| Layer | Framework | Coverage Target | Scope |
|-------|-----------|----------------|-------|
| **Unit Tests** | Jest + React Native Testing Library | 80% | • Utils functions<br>• Custom hooks<br>• State management<br>• Validation logic |
| **Integration Tests** | Supertest + Supabase Test Client | 70% | • API endpoints<br>• Database queries<br>• Auth flows<br>• Payment processing |
| **E2E Tests** | Detox (React Native) | Critical paths only | • User registration → First order<br>• Route download → Offline navigation<br>• Merchant: Order fulfillment |
| **Visual Regression** | Percy / Chromatic | Key screens | • Route detail<br>• Checkout flow<br>• Merchant dashboard |

### 14.3 Test Scenarios

#### Example: Unit Test - Stock Validation

```javascript
describe('validateStock', () => {
    it('should allow order when stock is sufficient', () => {
        const product = { id: '123', stock: 10 };
        const quantity = 5;
        expect(validateStock(product, quantity)).toBe(true);
    });

    it('should throw error when stock is insufficient', () => {
        const product = { id: '123', stock: 2 };
        const quantity = 5;
        expect(() => validateStock(product, quantity))
            .toThrow('INSUFFICIENT_STOCK');
    });

    it('should handle concurrent stock updates', async () => {
        // Simulate race condition
        const promises = Array(10).fill(null).map(() =>
            reserveStock('product-123', 1)
        );
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled');
        expect(successful.length).toBeLessThanOrEqual(product.stock);
    });
});
```

#### Example: Integration Test - Order Flow

```javascript
describe('POST /orders', () => {
    it('should create order with valid payment', async () => {
        const orderData = {
            merchant_id: 'merchant-123',
            items: [{ product_id: 'product-456', quantity: 2 }],
            estimated_pickup_time: new Date(Date.now() + 3600000)
        };

        const response = await request(app)
            .post('/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send(orderData)
            .expect(201);

        expect(response.body).toMatchObject({
            id: expect.any(String),
            status: 'pending',
            payment_status: 'completed'
        });

        // Verify database state
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', response.body.id)
            .single();

        expect(order.total_amount).toBe(expectedTotal);
    });

    it('should rollback order if payment fails', async () => {
        // Mock Stripe failure
        jest.spyOn(stripe.paymentIntents, 'create')
            .mockRejectedValueOnce(new Error('Card declined'));

        await request(app)
            .post('/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send(orderData)
            .expect(402);

        // Verify NO order in database
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId);

        expect(orders).toHaveLength(0);
    });
});
```

### 14.4 Testing Checklist

#### Pre-Launch Testing

- [ ] Unit tests achieving >80% coverage
- [ ] Integration tests covering all API endpoints
- [ ] E2E tests for critical user journeys
- [ ] Load testing with k6 (100 concurrent users)
- [ ] Security testing (penetration testing básico)
- [ ] Accessibility testing (WCAG 2.1 Level AA)
- [ ] Cross-platform testing (iOS 14+, Android 10+)
- [ ] Offline mode testing (airplane mode scenarios)
- [ ] Payment integration testing (test mode)
- [ ] Database migration testing

#### Beta Testing Checklist

- [ ] 10+ beta testers recruited
- [ ] Feedback collection mechanism (in-app survey)
- [ ] Bug tracking system setup (GitHub Issues)
- [ ] Analytics tracking enabled
- [ ] Crash reporting configured (Sentry)
- [ ] Performance monitoring active

---

**Related Documents:**
- [02 - Requirements](./02-requirements.md)
- [04 - Edge Cases](./04-edge-cases.md)
- [06 - Risk Management](./06-risk-management.md)
