import { NextRequest, NextResponse } from 'next/server';
import { getExperiencesInDB, updateExperiencePriceInDB } from '@/lib/store';

export async function GET() {
  try {
    const experiences = await getExperiencesInDB();
    return NextResponse.json({ success: true, experiences });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, current_price } = body;

    if (!code || current_price === undefined) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Experience code and price are required.' },
        { status: 400 }
      );
    }

    const updated = await updateExperiencePriceInDB(code, Number(current_price));

    return NextResponse.json({
      success: true,
      message: `Updated price for ${code} successfully!`,
      experiences: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
