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

    const matchInner: any = {};
    if (account && ['cash','bank','upi','wallet'].includes(account)) matchInner['transactions.account'] = account;
    if (from || to) {
      matchInner['transactions.date'] = {} as any;
      if (from) (matchInner['transactions.date'] as any).$gte = new Date(from);
      if (to) (matchInner['transactions.date'] as any).$lte = new Date(to);
    }

    const rows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      Object.keys(matchInner).length ? { $match: matchInner } : undefined,
      { $project: { month: { $dateToString: { format: '%Y-%m', date: '$transactions.date' } }, type: '$transactions.type', amount: '$transactions.amount' } },
      { $group: { _id: { month: '$month', type: '$type' }, total: { $sum: '$amount' } } },
      { $project: { _id: 0, month: '$_id.month', type: '$_id.type', total: 1 } },
      { $sort: { month: 1 } },
    ].filter(Boolean));

    const map = new Map<string, { month: string; income: number; expense: number }>();
    for (const r of rows) {
      if (!map.has(r.month)) map.set(r.month, { month: r.month, income: 0, expense: 0 });
      const row = map.get(r.month)!;
      if (r.type === 'income') row.income += r.total;
      else if (r.type === 'expense') row.expense += r.total;
    }

    return NextResponse.json({ data: Array.from(map.values()) });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
