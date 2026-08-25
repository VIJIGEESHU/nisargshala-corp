import { NextRequest, NextResponse } from 'next/server';
import { getBankSettingsInDB, updateBankSettingsInDB } from '@/lib/store';

export async function GET() {
  try {
    const settings = await getBankSettingsInDB();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account_holder, bank_name, account_number, ifsc_code, validity_months, gst_rate } = body;

    if (!account_holder || !bank_name || !account_number || !ifsc_code) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'All bank account fields are required.' },
        { status: 400 }
      );
    }

    const updated = await updateBankSettingsInDB({
      account_holder: String(account_holder).trim(),
      bank_name: String(bank_name).trim(),
      account_number: String(account_number).trim(),
      ifsc_code: String(ifsc_code).trim().toUpperCase(),
      validity_months: Number(validity_months) || 12,
      gst_rate: gst_rate !== undefined ? Number(gst_rate) : 18,
    });

    return NextResponse.json({
      success: true,
      message: 'Bank payment, tax, and voucher validity settings updated successfully!',
      settings: updated,
    });
  } catch (err: any) {
    console.error('Error saving bank settings:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
