# Nisargshala Corporate Gift Voucher System — Production Deployment Guide

Target Subdomain: **https://corp.nisargshala.in/**

---

## 1. System Requirements & Hosting Architecture

- **Subdomain**: `corp.nisargshala.in`
- **DNS Record**: Add an `A` record pointing `corp` to your Hostinger server IP address (or CNAME record as configured in Hostinger).
- **Node.js Engine**: Node.js v18+ or v20+ / v24+
- **Database**: Supabase PostgreSQL database instance (Isolated project/schema)

---

## 2. Environment Variables (.env)

Set the following environment variables in Hostinger Node.js application environment settings:

```env
# Domain Configuration
NEXT_PUBLIC_SITE_URL=https://corp.nisargshala.in

# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
SUPABASE_SECRET_KEY=<your-supabase-service-role-key>

# Retail Integration API Shared Secret (Shared with nisargshala.in)
VOUCHER_API_SECRET=<min-32-char-secure-random-secret-key>

# Environment
NODE_ENV=production
```

---

## 3. Database Migration Steps

1. Open your Supabase Project SQL Editor at `https://supabase.com/dashboard/project/<your-project-ref>/sql`.
2. Run the full schema script provided in `supabase/schema.sql`:
   ```sql
   -- Executes 12 table creations, indexes, initial settings, locked V1 products seed, and atomic redemption function
   ```
3. Confirm that all 12 tables and stored procedure `redeem_voucher_atomic` are active.

---

## 4. Hostinger Node.js Application Setup

1. Log into **Hostinger Control Panel** -> **Websites** -> `corp.nisargshala.in`.
2. Navigate to **Node.js Applications**.
3. Set **Node.js version** to `20.x` or `24.x`.
4. Set **Application Root**: `/public_html/corp` (or project root directory).
5. Set **Application Startup File**: `server.js` (from `.next/standalone/server.js`).
6. Upload the `.next/standalone` folder content and static files (`public` and `.next/static` into `.next/standalone/.next/static`).
7. Run Build / Start Command:
   ```bash
   npm run build
   npm run start
   ```

---

## 5. Retail Website Integration (`nisargshala.in`)

To connect the retail website to the corporate voucher engine:

1. Send requests to `https://corp.nisargshala.in/api/v1/vouchers/...`
2. Include authentication header:
   ```http
   Authorization: Bearer <VOUCHER_API_SECRET>
   Content-Type: application/json
   ```
3. Use endpoints:
   - `POST /api/v1/vouchers/validate`
   - `POST /api/v1/vouchers/reserve`
   - `POST /api/v1/vouchers/release`
   - `POST /api/v1/vouchers/redeem`
