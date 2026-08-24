import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Check admin session cookie
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' }, { status: 401 });
  }

  const defaultExperiences = [
    { code: 'CAMP_OVERNIGHT', title: 'Overnight Camping Stay', current_price: 1800 },
    { code: 'ADVENTURE_MOD', title: 'Adventure Module', current_price: 1600 },
    { code: 'FAMILY_CAMPING', title: 'Family Camping Package', current_price: 14800 },
    { code: 'KUTUHAL_FAMILY', title: 'Kutuhal Family Retreat', current_price: 14800 },
    { code: 'HUPPYA_KIDS', title: 'Huppya Outdoor Camp', current_price: 5600 },
    { code: 'SAHAS_KIDS', title: 'Sahas Adventure Camp', current_price: 6400 },
  ];

  try {
    let supabaseOrders: any[] = [];
    let supabaseVouchers: any[] = [];
    let supabaseAuditLogs: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: o } = await supabaseAdmin.from('orders').select('*, company:companies(*), items:order_items(*)').order('created_at', { ascending: false });
        const { data: v } = await supabaseAdmin.from('vouchers').select('*').order('created_at', { ascending: false });
        const { data: a } = await supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
        
        if (o) supabaseOrders = o;
        if (v) supabaseVouchers = v;
        if (a) supabaseAuditLogs = a;
      } catch (e) {
        console.warn('Supabase admin fetch warning (merging with local DB):', e);
      }
    }

    const db = readDB();
    const localOrders = db.orders || [];
    const localVouchers = db.vouchers || [];
    const localAuditLogs = db.audit_logs || [];

    // Merge orders without duplicates
    const mergedOrdersMap = new Map<string, any>();
    [...supabaseOrders, ...localOrders].forEach((ord) => {
      const key = ord.id || ord.order_number;
      if (!mergedOrdersMap.has(key)) {
        mergedOrdersMap.set(key, ord);
      }
    });

    // Merge vouchers without duplicates
    const mergedVouchersMap = new Map<string, any>();
    [...supabaseVouchers, ...localVouchers].forEach((vch) => {
      const key = vch.id || vch.redemption_code;
      if (!mergedVouchersMap.has(key)) {
        mergedVouchersMap.set(key, vch);
      }
    });

    const combinedOrders = Array.from(mergedOrdersMap.values());
    const combinedVouchers = Array.from(mergedVouchersMap.values());
    const combinedLogs = [...supabaseAuditLogs, ...localAuditLogs].slice(0, 50);

    return NextResponse.json({
      orders: combinedOrders,
      vouchers: combinedVouchers,
      experiences: defaultExperiences,
      auditLogs: combinedLogs,
    });
  } catch (err: any) {
    console.error('Error fetching admin data:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
