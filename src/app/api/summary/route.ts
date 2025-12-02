import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import Transaction from '../../../models/Transaction';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const match: any = {};
    if (from || to) {
      match.date = {} as any;
      if (from) (match.date as any).$gte = new Date(from);
      if (to) (match.date as any).$lte = new Date(to);
    }

    const result = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    let incomeTotal = 0;
    let expenseTotal = 0;
    for (const r of result) {
      if (r._id === 'income') incomeTotal = r.total || 0;
      if (r._id === 'expense') expenseTotal = r.total || 0;
    }

    const balance = incomeTotal - expenseTotal;
    return NextResponse.json({ incomeTotal, expenseTotal, balance });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
