import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const { searchParams } = new URL(req.url);
    const limit = Math.max(0, Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 200));
    const budgetsLimit = Math.max(0, Math.min(parseInt(searchParams.get('budgetsLimit') || '20', 10) || 20, 200));

    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const txns = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      { $replaceRoot: { newRoot: '$transactions' } },
      { $sort: { date: -1, createdAt: -1 } },
      { $limit: limit },
    ]);

    const budgets = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$budgets' },
      { $replaceRoot: { newRoot: '$budgets' } },
      { $sort: { month: -1, category: 1, createdAt: -1 } },
      { $limit: budgetsLimit },
    ]);

    return NextResponse.json({
      user: { id: user._id.toString(), name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
      transactions: txns,
      budgets,
      counts: {
        transactions: Array.isArray(user.transactions) ? user.transactions.length : 0,
        budgets: Array.isArray((user as any).budgets) ? (user as any).budgets.length : 0,
      },
    });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
