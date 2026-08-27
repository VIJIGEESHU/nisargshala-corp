-- ====================================================================
-- NISARGSHALA CORPORATE GIFT VOUCHER SYSTEM
-- Database Schema for https://corp.nisargshala.in/
-- Isolated PostgreSQL schema on Supabase
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  bank_account_name TEXT NOT NULL DEFAULT 'Nisargshala',
  bank_name TEXT NOT NULL DEFAULT 'HDFC Bank',
  account_number TEXT NOT NULL DEFAULT '50200012345678',
  ifsc_code TEXT NOT NULL DEFAULT 'HDFC0001234',
  branch_name TEXT NOT NULL DEFAULT 'Kothrud, Pune',
  upi_id TEXT DEFAULT 'nisargshala@hdfcbank',
  default_validity_months INT NOT NULL DEFAULT 12,
  support_email TEXT NOT NULL DEFAULT 'corporate@nisargshala.in',
  support_phone TEXT NOT NULL DEFAULT '+91 98765 43210',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial settings if empty
INSERT INTO system_settings (id, bank_account_name, bank_name, account_number, ifsc_code, branch_name, default_validity_months)
VALUES ('default', 'Nisargshala', 'HDFC Bank', '50200012345678', 'HDFC0001234', 'Kothrud, Pune', 12)
ON CONFLICT (id) DO NOTHING;

-- 2. EXPERIENCE CATALOGUE
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  current_price NUMERIC(10,2) NOT NULL CHECK (current_price >= 0),
  age_min INT DEFAULT 0,
  age_max INT DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed experiences
INSERT INTO experiences (code, title, description, current_price, age_min, age_max) VALUES
('CAMPING_OVERNIGHT', 'Overnight Camping (Individual)', 'Overnight Tent Camping per person', 1800.00, 5, 70),
('ADVENTURE', 'Adventure Experience', 'Full adventure activities module per person', 1600.00, 5, 70),
('FAMILY_CAMPING', 'Family Camping (2A + 1C)', 'Overnight camping for 2 Adults + 1 Child', 4800.00, 0, 70),
('FAMILY_ADVENTURE', 'Family Adventure (2A + 1C)', 'Adventure module for 2 Adults + 1 Child', 4800.00, 0, 70),
('KUTUHAL_ADULT', 'Kutuhal Family Experience (Adult)', 'Kutuhal experience per adult', 5600.00, 18, 70),
('KUTUHAL_CHILD', 'Kutuhal Family Experience (Child < 7)', 'Kutuhal experience for child under 7 years', 3600.00, 0, 6),
('HUPPYA', 'Huppya Kids Camp', 'Specialized kids outdoor experience camp', 5600.00, 6, 14),
('SAHAS', 'Sahas Kids Adventure', 'Specialized kids adventure camp', 6400.00, 8, 16)
ON CONFLICT (code) DO UPDATE SET 
  current_price = EXCLUDED.current_price,
  title = EXCLUDED.title,
  updated_at = now();

-- 3. LOCKED CORPORATE VOUCHER PRODUCTS
CREATE TABLE IF NOT EXISTS voucher_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  face_value NUMERIC(10,2) NOT NULL CHECK (face_value > 0),
  eligible_experience_codes TEXT[] NOT NULL,
  description TEXT,
  terms TEXT[],
  is_locked BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Locked V1 Products
INSERT INTO voucher_products (product_code, title, subtitle, face_value, eligible_experience_codes, description, terms) VALUES
('INDIVIDUAL', 'Individual Experience Voucher', 'Overnight Camping + Adventure', 4000.00, 
  ARRAY['CAMPING_OVERNIGHT', 'ADVENTURE'], 
  'Valid for 1 Individual employee for Overnight Tent Camping & Adventure Experience.',
  ARRAY['Valid for 12 months from issue', 'Redeemable on nisargshala.in', 'Non-refundable for cash', 'Single-use voucher']
),
('FAMILY', 'Family Experience Voucher', 'Family Camping + Adventure OR Kutuhal', 12000.00, 
  ARRAY['FAMILY_CAMPING', 'FAMILY_ADVENTURE', 'KUTUHAL_ADULT', 'KUTUHAL_CHILD'], 
  'Valid for 2 Adults + 1 Child for Overnight Family Camping & Adventure OR Kutuhal Family Experience.',
  ARRAY['Valid for 12 months from issue', 'Redeemable on nisargshala.in', 'Non-refundable for cash', 'Single-use voucher', 'Balance to be paid by user if experience cost exceeds voucher value']
),
('KIDS', 'Kids Experience Voucher', 'Huppya OR Sahas Camp', 7000.00, 
  ARRAY['HUPPYA', 'SAHAS'], 
  'Valid for 1 Child for Huppya or Sahas outdoor experience camp.',
  ARRAY['Valid for 12 months from issue', 'Redeemable on nisargshala.in', 'Non-refundable for cash', 'Single-use voucher', 'No cash refund if experience price is lower than voucher value']
)
ON CONFLICT (product_code) DO UPDATE SET 
  face_value = EXCLUDED.face_value,
  eligible_experience_codes = EXCLUDED.eligible_experience_codes;

-- 4. COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  designation TEXT,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  gst_number TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CORPORATE USERS (Auth integration)
CREATE TABLE IF NOT EXISTS corporate_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  role VARCHAR(20) DEFAULT 'CORPORATE_HR' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'CORPORATE_HR')),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT NOT NULL,
  subtotal_amount NUMERIC(10,2) NOT NULL CHECK (subtotal_amount >= 0),
  gst_amount NUMERIC(10,2) DEFAULT 0 CHECK (gst_amount >= 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_status VARCHAR(30) DEFAULT 'PENDING_PAYMENT' CHECK (payment_status IN ('PENDING_PAYMENT', 'AWAITING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED')),
  order_status VARCHAR(30) DEFAULT 'SUBMITTED' CHECK (order_status IN ('SUBMITTED', 'VERIFYING_PAYMENT', 'COMPLETED', 'CANCELLED')),
  utr_reference TEXT,
  payment_date DATE,
  payment_method VARCHAR(30) DEFAULT 'RTGS_NEFT',
  payment_proof_url TEXT,
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_code VARCHAR(50) REFERENCES voucher_products(product_code) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price > 0)
);

-- 8. VOUCHERS
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  human_ref VARCHAR(50) UNIQUE NOT NULL,
  redemption_code VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE RESTRICT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT NOT NULL,
  product_code VARCHAR(50) REFERENCES voucher_products(product_code) NOT NULL,
  voucher_value NUMERIC(10,2) NOT NULL CHECK (voucher_value > 0),
  eligible_experience_codes TEXT[] NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'RESERVED', 'REDEEMED', 'EXPIRED', 'CANCELLED', 'VOID')),
  issue_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ NOT NULL,
  reservation_token VARCHAR(100),
  reserved_until TIMESTAMPTZ,
  assigned_employee_name TEXT,
  assigned_employee_email TEXT,
  assigned_employee_mobile TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_redemption_code ON vouchers(redemption_code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_company ON vouchers(company_id);

-- 9. EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  employee_mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. REDEMPTIONS
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES vouchers(id) ON DELETE RESTRICT NOT NULL,
  redemption_code VARCHAR(50) NOT NULL,
  experience_code VARCHAR(50) NOT NULL,
  experience_title TEXT NOT NULL,
  experience_price NUMERIC(10,2) NOT NULL CHECK (experience_price >= 0),
  voucher_value NUMERIC(10,2) NOT NULL CHECK (voucher_value >= 0),
  customer_paid_balance NUMERIC(10,2) NOT NULL CHECK (customer_paid_balance >= 0),
  unused_voucher_amount NUMERIC(10,2) DEFAULT 0 CHECK (unused_voucher_amount >= 0),
  retail_booking_id TEXT,
  participant_details JSONB DEFAULT '{}'::jsonb,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT
);

-- 11. PAYMENT RECORDS
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method VARCHAR(30) DEFAULT 'RTGS_NEFT',
  utr_reference TEXT NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'VERIFIED' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ATOMIC VOUCHER REDEMPTION STORED PROCEDURE
-- Guarantees race-condition free validation and atomic redemption!
CREATE OR REPLACE FUNCTION redeem_voucher_atomic(
  p_redemption_code VARCHAR(50),
  p_experience_code VARCHAR(50),
  p_experience_title TEXT,
  p_experience_price NUMERIC(10,2),
  p_retail_booking_id TEXT,
  p_participant_details JSONB,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_voucher RECORD;
  v_customer_balance NUMERIC(10,2);
  v_unused_amount NUMERIC(10,2);
  v_redemption_id UUID;
BEGIN
  -- Lock row exclusively for update
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE redemption_code = p_redemption_code
  FOR UPDATE;

  -- 1. Check existence
  IF v_voucher IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'VOUCHER_NOT_FOUND', 'message', 'Invalid voucher code.');
  END IF;

  -- 2. Check status
  IF v_voucher.status = 'PENDING_PAYMENT' THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNPAID_VOUCHER', 'message', 'Voucher payment has not been confirmed yet.');
  ELSIF v_voucher.status = 'REDEEMED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_REDEEMED', 'message', 'This voucher has already been redeemed.');
  ELSIF v_voucher.status = 'EXPIRED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'VOUCHER_EXPIRED', 'message', 'This voucher has expired.');
  ELSIF v_voucher.status = 'CANCELLED' OR v_voucher.status = 'VOID' THEN
    RETURN jsonb_build_object('success', false, 'error', 'VOUCHER_INVALID', 'message', 'This voucher is cancelled or void.');
  ELSIF v_voucher.status NOT IN ('ACTIVE', 'RESERVED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS', 'message', 'Voucher is not eligible for redemption.');
  END IF;

  -- 3. Check expiration date
  IF v_voucher.expiry_date < now() THEN
    UPDATE vouchers SET status = 'EXPIRED', updated_at = now() WHERE id = v_voucher.id;
    RETURN jsonb_build_object('success', false, 'error', 'VOUCHER_EXPIRED', 'message', 'Voucher expired on ' || v_voucher.expiry_date::text);
  END IF;

  -- 4. Check experience eligibility
  IF NOT (p_experience_code = ANY(v_voucher.eligible_experience_codes)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'INELIGIBLE_EXPERIENCE', 'message', 'This voucher is not valid for the selected experience.');
  END IF;

  -- Calculate balance / non-refundable unused value
  IF p_experience_price > v_voucher.voucher_value THEN
    v_customer_balance := p_experience_price - v_voucher.voucher_value;
    v_unused_amount := 0;
  ELSE
    v_customer_balance := 0;
    v_unused_amount := v_voucher.voucher_value - p_experience_price;
  END IF;

  -- Update voucher status to REDEEMED
  UPDATE vouchers
  SET status = 'REDEEMED',
      updated_at = now()
  WHERE id = v_voucher.id;

  -- Insert redemption record
  INSERT INTO redemptions (
    voucher_id, redemption_code, experience_code, experience_title,
    experience_price, voucher_value, customer_paid_balance, unused_voucher_amount,
    retail_booking_id, participant_details, ip_address
  ) VALUES (
    v_voucher.id, p_redemption_code, p_experience_code, p_experience_title,
    p_experience_price, v_voucher.voucher_value, v_customer_balance, v_unused_amount,
    p_retail_booking_id, p_participant_details, p_ip_address
  ) RETURNING id INTO v_redemption_id;

  -- Insert Audit Log
  INSERT INTO audit_logs (actor_type, action, entity_type, entity_id, metadata)
  VALUES ('RETAIL_API', 'VOUCHER_REDEEMED', 'VOUCHER', v_voucher.id, jsonb_build_object(
    'redemption_id', v_redemption_id,
    'experience_code', p_experience_code,
    'retail_booking_id', p_retail_booking_id
  ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Voucher redeemed successfully!',
    'voucher_id', v_voucher.id,
    'human_ref', v_voucher.human_ref,
    'product_code', v_voucher.product_code,
    'voucher_value', v_voucher.voucher_value,
    'experience_price', p_experience_price,
    'customer_paid_balance', v_customer_balance,
    'unused_amount', v_unused_amount
  );
END;
$$;

-- ====================================================================
-- SERVER DATABASE PERMISSIONS & SERVICE ROLE PRIVILEGES
-- ====================================================================

-- Explicit schema & table grants for service_role and postgres roles (server-side API operations)
GRANT USAGE ON SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role, postgres;

-- Enable RLS and create explicit service_role policies on all tables
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS corporate_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on companies" ON companies;
CREATE POLICY "Service role full access on companies" ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on corporate_users" ON corporate_users;
CREATE POLICY "Service role full access on corporate_users" ON corporate_users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on orders" ON orders;
CREATE POLICY "Service role full access on orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on order_items" ON order_items;
CREATE POLICY "Service role full access on order_items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on vouchers" ON vouchers;
CREATE POLICY "Service role full access on vouchers" ON vouchers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on payment_records" ON payment_records;
CREATE POLICY "Service role full access on payment_records" ON payment_records FOR ALL TO service_role USING (true) WITH CHECK (true);


