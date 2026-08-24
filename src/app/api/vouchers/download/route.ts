import { NextRequest, NextResponse } from 'next/server';
import { readDB, confirmPaymentAndGenerateVouchersInDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { generateVoucherHtml, generateBulkOrderVouchersZip, generateRedemptionQRCode } from '@/lib/pdfGenerator';
import { LOCKED_VOUCHER_PRODUCTS } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const voucherId = searchParams.get('voucher_id');
  const orderId = searchParams.get('order_id');
  const companyId = searchParams.get('company_id');

  try {
    let vouchers: any[] = [];
    let companyName = 'Nisargshala Corporate Client';

    // 1. Fetch from Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();

        if (voucherId) {
          const { data: vch } = await supabaseAdmin.from('vouchers').select('*, company:companies(*)').eq('id', voucherId).single();
          if (vch) vouchers.push(vch);
        } else if (orderId) {
          const { data: vchs } = await supabaseAdmin.from('vouchers').select('*, company:companies(*)').eq('order_id', orderId);
          if (vchs && vchs.length > 0) vouchers.push(...vchs);
        } else if (companyId) {
          const { data: vchs } = await supabaseAdmin.from('vouchers').select('*, company:companies(*)').eq('company_id', companyId);
          if (vchs && vchs.length > 0) vouchers.push(...vchs);
        }
      } catch (e) {
        console.warn('Supabase voucher download fetch warning:', e);
      }
    }

    // 2. Fetch from Local Store DB
    const db = readDB();
    if (voucherId) {
      const vch = db.vouchers.find((v) => v.id === voucherId || v.human_ref === voucherId || v.redemption_code === voucherId);
      if (vch) vouchers.push(vch);
    } else if (orderId) {
      const localVchs = db.vouchers.filter((v) => v.order_id === orderId || v.order_id.includes(orderId));
      vouchers.push(...localVchs);
    } else if (companyId) {
      const localVchs = db.vouchers.filter((v) => v.company_id === companyId);
      vouchers.push(...localVchs);
    }

    // Deduplicate vouchers by redemption_code / human_ref / id
    const voucherMap = new Map<string, any>();
    vouchers.forEach((v) => {
      const key = v.id || v.redemption_code || v.human_ref;
      if (!voucherMap.has(key)) voucherMap.set(key, v);
    });
    vouchers = Array.from(voucherMap.values());

    // 3. Fallback: If no vouchers found for orderId, generate/fulfill on demand
    if (vouchers.length === 0 && orderId) {
      try {
        const fulfillRes = await confirmPaymentAndGenerateVouchersInDB(orderId);
        if (fulfillRes && fulfillRes.vouchers && fulfillRes.vouchers.length > 0) {
          vouchers = fulfillRes.vouchers;
        }
      } catch (e) {
        console.warn('On-demand voucher generation warning:', e);
      }
    }

    if (vouchers.length > 0) {
      const compId = vouchers[0].company_id;
      const comp = db.companies.find((c) => c.id === compId);
      if (comp) companyName = comp.company_name;
      else if (vouchers[0].company?.company_name) companyName = vouchers[0].company.company_name;
    }

    if (vouchers.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'No vouchers found for the requested parameters.' }, { status: 404 });
    }

    // Format voucher data objects for HTML / ZIP generation
    const formattedVouchers = vouchers.map((v) => {
      const pDef = LOCKED_VOUCHER_PRODUCTS[v.product_code as keyof typeof LOCKED_VOUCHER_PRODUCTS];
      return {
        humanRef: v.human_ref,
        redemptionCode: v.redemption_code,
        productTitle: pDef ? pDef.title : `${v.product_code} Experience Voucher`,
        voucherValue: v.voucher_value,
        companyName,
        issueDate: v.issue_date ? new Date(v.issue_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        expiryDate: v.expiry_date ? new Date(v.expiry_date).toISOString().slice(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        eligibleExperiences: pDef ? pDef.eligibleExperiences : [],
        terms: [
          'Valid for 12 months from issue date.',
          'Redeemable exclusively on nisargshala.in.',
          'Single-use voucher. Non-refundable for cash.',
        ],
        assignedEmployee: v.assigned_employee_name || undefined,
      };
    });

    // Case 1: Single Voucher HTML Document Download
    if (vouchers.length === 1) {
      const qrCode = await generateRedemptionQRCode();
      const html = generateVoucherHtml(formattedVouchers[0], qrCode);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${formattedVouchers[0].humanRef}.html"`,
        },
      });
    }

    // Case 2: Bulk Vouchers ZIP Archive Download (N Individual Files + Combined Document)
    const zipBuffer = await generateBulkOrderVouchersZip(formattedVouchers);
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="NISARGSHALA_VOUCHERS_${orderId || companyId || 'BULK'}.zip"`,
      },
    });
  } catch (err: any) {
    console.error('Download voucher error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
