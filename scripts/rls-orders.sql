-- =============================================
-- RLS Policies for Orders System
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table (if not already enabled)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Drop existing policies (if any)
-- =============================================
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Business owners can view their business orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Business owners can update their business orders" ON orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Business owners can manage their products" ON products;

-- =============================================
-- Orders Table Policies
-- =============================================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Business owners can view orders for their businesses
CREATE POLICY "Business owners can view their business orders"
ON orders FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Customers can create orders
CREATE POLICY "Customers can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Customers can update their own pending orders (cancel)
CREATE POLICY "Customers can update own pending orders"
ON orders FOR UPDATE
TO authenticated
USING (customer_id = auth.uid() AND status = 'pendiente')
WITH CHECK (customer_id = auth.uid());

-- Business owners can update orders for their businesses
CREATE POLICY "Business owners can update their business orders"
ON orders FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- =============================================
-- Order Items Table Policies
-- =============================================

-- Users can view order items for orders they can see
CREATE POLICY "Users can view order items for their orders"
ON order_items FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE customer_id = auth.uid()
    OR business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
);

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert order items for their orders"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
  )
);

-- =============================================
-- Notifications Table Policies (if not exists)
-- =============================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert notifications (for system use)
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- Products Table Policies (if needed)
-- =============================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
TO authenticated
USING (is_available = true);

-- Business owners can manage their products
CREATE POLICY "Business owners can manage their products"
ON products FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);
