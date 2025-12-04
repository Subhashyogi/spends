import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import mongoose from 'mongoose';
import User from '@/models/User';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const rows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      {
        $group: {
          _id: { $ifNull: ['$transactions.account', 'cash'] },
          income: {
            $sum: {
              $cond: [{ $eq: ['$transactions.type', 'income'] }, '$transactions.amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$transactions.type', 'expense'] }, '$transactions.amount', 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          account: '$_id',
          income: 1,
          expense: 1,
          net: { $subtract: ['$income', '$expense'] },
        },
      },
      { $sort: { account: 1 } },
    ]);

    const total = rows.reduce((s: number, r: any) => s + (r.net || 0), 0);
    return NextResponse.json({ data: rows, total });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
