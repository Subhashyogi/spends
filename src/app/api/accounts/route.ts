import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import mongoose from 'mongoose';
import { accountCreateSchema } from '@/lib/validation';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const doc = await User.findById(userId).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const accounts = Array.isArray((doc as any).accounts) ? (doc as any).accounts : [];
    return NextResponse.json({ data: accounts });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = accountCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    const name = parsed.data.name.trim();
    if (!name) return NextResponse.json({ error: 'Invalid account name' }, { status: 400 });
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $addToSet: { accounts: name } }
    ).exec();
    if (!result.modifiedCount && !result.matchedCount) return NextResponse.json({ error: 'Failed to add account' }, { status: 500 });
    return NextResponse.json({ data: { name } }, { status: 201 });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
