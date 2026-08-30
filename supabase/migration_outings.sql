-- ====================================================================
-- NISARGSHALA CORPORATE GATEWAY: TEAM OUTINGS, INVOICES & ENQUIRIES MIGRATION
-- Run this script in the Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEAM OUTING BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.team_outing_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  package_code VARCHAR(50) NOT NULL,
  package_title TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  attendees_count INT NOT NULL CHECK (attendees_count > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  subtotal_amount NUMERIC(10,2) NOT NULL CHECK (subtotal_amount >= 0),
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  buyer_gstin TEXT,
  payment_status VARCHAR(30) DEFAULT 'PENDING_PAYMENT' CHECK (payment_status IN ('PENDING_PAYMENT', 'AWAITING_VERIFICATION', 'PAID', 'FAILED', 'CANCELLED')),
  booking_status VARCHAR(30) DEFAULT 'REQUESTED' CHECK (booking_status IN ('REQUESTED', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED')),
  utr_reference TEXT,
  payment_date DATE,
  special_requirements TEXT,
  invoice_number VARCHAR(50),
  email_status VARCHAR(20) DEFAULT 'PENDING',
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_outings_booking_num ON public.team_outing_bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_team_outings_company_id ON public.team_outing_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_team_outings_payment_status ON public.team_outing_bookings(payment_status);

-- 2. CUSTOM CORPORATE ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.custom_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number VARCHAR(50) UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  gst_number TEXT,
  team_size INT NOT NULL DEFAULT 10,
  preferred_date TEXT,
  preferred_location TEXT,
  experience_type TEXT,
  budget_range TEXT,
  special_requirements TEXT,
  status VARCHAR(20) DEFAULT 'NEW',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_enquiries_enquiry_num ON public.custom_enquiries(enquiry_number);

-- 3. TAX INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.tax_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.team_outing_bookings(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  seller_gstin TEXT NOT NULL DEFAULT '27ARHPV2783R1ZN',
  buyer_gstin TEXT NOT NULL,
  subtotal_amount NUMERIC(10,2) NOT NULL CHECK (subtotal_amount >= 0),
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  advance_received NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_invoices_invoice_num ON public.tax_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_booking_id ON public.tax_invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_order_id ON public.tax_invoices(order_id);

-- 4. PERMISSIONS & RLS POLICIES
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres;

ALTER TABLE IF EXISTS public.team_outing_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custom_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on team_outing_bookings" ON public.team_outing_bookings;
CREATE POLICY "Service role full access on team_outing_bookings" ON public.team_outing_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on custom_enquiries" ON public.custom_enquiries;
CREATE POLICY "Service role full access on custom_enquiries" ON public.custom_enquiries FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on tax_invoices" ON public.tax_invoices;
CREATE POLICY "Service role full access on tax_invoices" ON public.tax_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
