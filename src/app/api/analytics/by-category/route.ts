import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/db';
import { requireUser } from '../../../../lib/auth-helpers';
import mongoose from 'mongoose';
import User from '../../../../models/User';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const account = searchParams.get('account');
    const type = searchParams.get('type') === 'income' ? 'income' : 'expense'; // default expense

    const matchInner: any = { 'transactions.type': type };
    if (account && ['cash','bank','upi','wallet'].includes(account)) matchInner['transactions.account'] = account;
    if (from || to) {
      matchInner['transactions.date'] = {} as any;
      if (from) (matchInner['transactions.date'] as any).$gte = new Date(from);
      if (to) (matchInner['transactions.date'] as any).$lte = new Date(to);
    }

    const rows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      { $match: matchInner },
      { $group: { _id: { category: '$transactions.category' }, total: { $sum: '$transactions.amount' } } },
      { $project: { _id: 0, category: { $ifNull: ['$_id.category', 'Uncategorized'] }, total: 1 } },
      { $sort: { total: -1 } },
    ]);

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
