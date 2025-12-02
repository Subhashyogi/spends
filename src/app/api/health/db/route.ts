import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/db';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hasUri = Boolean(process.env.MONGODB_URI);
    const dbName = process.env.MONGODB_DB || null;
    await connectToDatabase();
    const state = mongoose.connection.readyState; // 1=connected, 2=connecting
    return NextResponse.json({ ok: true, hasUri, dbName, state });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Database error',
        message: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
