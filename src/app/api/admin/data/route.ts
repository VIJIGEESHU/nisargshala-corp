import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Check admin session cookie
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    if (isSupabaseConfigured()) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: orders } = await supabaseAdmin.from('orders').select('*, company:companies(*), items:order_items(*)').order('created_at', { ascending: false });
      const { data: vouchers } = await supabaseAdmin.from('vouchers').select('*').order('created_at', { ascending: false });
      const { data: experiences } = await supabaseAdmin.from('experiences').select('*');
      const { data: auditLogs } = await supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);

      return NextResponse.json({
        orders: orders || [],
        vouchers: vouchers || [],
        experiences: experiences || [],
        auditLogs: auditLogs || [],
      });
    }

    const db = readDB();
    const defaultExperiences = [
      { code: 'CAMP_OVERNIGHT', title: 'Overnight Camping Stay', current_price: 1800 },
      { code: 'ADVENTURE_MOD', title: 'Adventure Module', current_price: 1600 },
      { code: 'FAMILY_CAMPING', title: 'Family Camping Package', current_price: 14800 },
      { code: 'KUTUHAL_FAMILY', title: 'Kutuhal Family Retreat', current_price: 14800 },
      { code: 'HUPPYA_KIDS', title: 'Huppya Outdoor Camp', current_price: 5600 },
      { code: 'SAHAS_KIDS', title: 'Sahas Adventure Camp', current_price: 6400 },
    ];

    return NextResponse.json({
      orders: db.orders || [],
      vouchers: db.vouchers || [],
      experiences: defaultExperiences,
      auditLogs: db.audit_logs || [],
    });
  } catch (err: any) {
    console.error('Error fetching admin data:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
