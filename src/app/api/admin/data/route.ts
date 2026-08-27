import { NextRequest, NextResponse } from 'next/server';
import { readDB, getExperiencesInDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Check admin session cookie
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' }, { status: 401 });
  }

  const defaultExperiences = await getExperiencesInDB();

  try {
    let supabaseOrders: any[] = [];
    let supabaseVouchers: any[] = [];
    let supabaseAuditLogs: any[] = [];
    let supabaseOutings: any[] = [];
    let supabaseEnquiries: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: o } = await supabaseAdmin.from('orders').select('*, company:companies(*)').order('created_at', { ascending: false });
        const { data: v } = await supabaseAdmin.from('vouchers').select('*').order('created_at', { ascending: false });
        const { data: a } = await supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
        const { data: out } = await supabaseAdmin.from('team_outing_bookings').select('*, company:companies(*)').order('created_at', { ascending: false });
        const { data: enq } = await supabaseAdmin.from('custom_enquiries').select('*').order('created_at', { ascending: false });

        if (o) supabaseOrders = o;
        if (v) supabaseVouchers = v;
        if (a) supabaseAuditLogs = a;
        if (out) supabaseOutings = out;
        if (enq) supabaseEnquiries = enq;
      } catch (e) {
        console.warn('Supabase admin fetch warning (merging with local DB):', e);
      }
    }

    const db = readDB();
    const localOrders = db.orders || [];
    const localVouchers = db.vouchers || [];
    const localAuditLogs = db.audit_logs || [];
    const localOutings = db.team_outing_bookings || [];
    const localEnquiries = db.custom_enquiries || [];

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

    // Merge outings without duplicates
    const mergedOutingsMap = new Map<string, any>();
    [...supabaseOutings, ...localOutings].forEach((out) => {
      const key = out.id || out.booking_number;
      if (!mergedOutingsMap.has(key)) {
        mergedOutingsMap.set(key, out);
      }
    });

    // Merge enquiries without duplicates
    const mergedEnquiriesMap = new Map<string, any>();
    [...supabaseEnquiries, ...localEnquiries].forEach((enq) => {
      const key = enq.id || enq.enquiry_number;
      if (!mergedEnquiriesMap.has(key)) {
        mergedEnquiriesMap.set(key, enq);
      }
    });

    const combinedOrders = Array.from(mergedOrdersMap.values());
    const combinedVouchers = Array.from(mergedVouchersMap.values());
    const combinedOutings = Array.from(mergedOutingsMap.values());
    const combinedEnquiries = Array.from(mergedEnquiriesMap.values());
    const combinedLogs = [...supabaseAuditLogs, ...localAuditLogs].slice(0, 50);

    return NextResponse.json({
      orders: combinedOrders,
      vouchers: combinedVouchers,
      outings: combinedOutings,
      enquiries: combinedEnquiries,
      experiences: defaultExperiences,
      auditLogs: combinedLogs,
    });
  } catch (err: any) {
    console.error('Error fetching admin data:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
