# Production Deployment Package — Nisargshala Corporate Gift Voucher System

Target Subdomain: **https://corp.nisargshala.in/**

---

## Deployment Package Files Created

1. **Standalone Application Archive**: [`nisargshala-corp-standalone-deployment.zip`](file:///c:/Users/Jarvis/Nis%20Corp/nisargshala-corp-standalone-deployment.zip)
2. **Database SQL Migration**: [`supabase/schema.sql`](file:///c:/Users/Jarvis/Nis%20Corp/supabase/schema.sql)
3. **Environment Template**: [`.env.example`](file:///c:/Users/Jarvis/Nis%20Corp/.env.example)

---

## Quick 4-Step Production Setup

### Step 1: Database Migration (Supabase)
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the full SQL script from [`supabase/schema.sql`](file:///c:/Users/Jarvis/Nis%20Corp/supabase/schema.sql).
3. This sets up all 12 PostgreSQL tables, indexes, seeding data, and the `redeem_voucher_atomic` stored procedure.

### Step 2: DNS Configuration (Hostinger / Registrar)
1. In your DNS management console for `nisargshala.in`:
2. Add an **A Record**:
   - Host: `corp`
   - Points to: Your Hostinger VPS / Server IP Address
3. Target URL: `https://corp.nisargshala.in/`

### Step 3: Hostinger Application Setup
1. In Hostinger Control Panel -> **Node.js Applications** -> Select `corp.nisargshala.in`.
2. Upload and extract [`nisargshala-corp-standalone-deployment.zip`](file:///c:/Users/Jarvis/Nis%20Corp/nisargshala-corp-standalone-deployment.zip).
3. Set **Startup File**: `server.js`
4. Set **Environment Variables**:
   ```env
   NEXT_PUBLIC_SITE_URL=https://corp.nisargshala.in
   NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
   SUPABASE_SECRET_KEY=<your-supabase-service-role-key>
   VOUCHER_API_SECRET=<your-min-32-char-retail-api-secret>
   NODE_ENV=production
   ```

### Step 4: Launch Server Process
- Click **Start / Restart** application in Hostinger Node manager (or run `node server.js` / `pm2 start server.js --name "corp-vouchers"`).
- Verification: The server is verified and running locally at `http://localhost:3000`.
