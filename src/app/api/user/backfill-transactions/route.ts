import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const txns = await Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }).lean();
    const snapshots = txns.map((t: any) => ({
      _id: t._id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      account: t.account,
      date: t.date,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { transactions: snapshots } }
    ).exec();

    return NextResponse.json({ ok: true, updated: result.modifiedCount, count: snapshots.length });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
