import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import Budget from '@/models/Budget';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const docs = await Budget.find({ userId }).sort({ month: -1, category: 1 }).lean();
    const snapshots = docs.map((b: any) => ({
      _id: b._id,
      month: b.month,
      amount: b.amount,
      category: b.category ?? null,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { budgets: snapshots } }
    ).exec();

    return NextResponse.json({ ok: true, updated: result.modifiedCount, count: snapshots.length });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
