import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { budgetCreateSchema } from '../../../lib/validation';
import { requireUser } from '../../../lib/auth-helpers';
import mongoose from 'mongoose';
import User from '../../../models/User';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function monthRange(month: string) {
  // month in format YYYY-MM
  const [y, m] = month.split('-').map((x) => parseInt(x, 10));
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)); // last day of month
  return { start, end };
}

async function attachUsage(userId: string, budgets: any[]) {
  const withUsage = [] as any[];
  for (const b of budgets) {
    const { start, end } = monthRange(b.month);
    const matchInner: any = { 'transactions.type': 'expense', 'transactions.date': { $gte: start, $lte: end } };
    if (b.category) matchInner['transactions.category'] = b.category;
    const agg = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      { $match: matchInner },
      { $group: { _id: null, total: { $sum: '$transactions.amount' } } },
    ]);
    const spent = agg[0]?.total ?? 0;
    const usedPct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
    const status = spent >= b.amount ? 'over' : usedPct >= 80 ? 'warning' : 'ok';
    withUsage.push({ ...b.toObject?.() ?? b, spent, usedPct, status });
  }
  return withUsage;
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const pipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$budgets' },
    ];
    if (month) pipeline.push({ $match: { 'budgets.month': month } });
    pipeline.push(
      { $replaceRoot: { newRoot: '$budgets' } },
      { $sort: { month: -1, category: 1 } },
    );
    const data = await User.aggregate(pipeline);
    const out = await attachUsage(userId, data);
    return NextResponse.json({ data: out });
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
    const parsed = budgetCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    const month = parsed.data.month;
    const category = (parsed.data.category ?? null) as any;
    const dup = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$budgets' },
      { $match: { 'budgets.month': month, 'budgets.category': category } },
      { $limit: 1 },
    ]);
    if (dup.length) return NextResponse.json({ error: 'Budget already exists for this month/category' }, { status: 409 });
    const now = new Date();
    const snapshot: any = {
      _id: new mongoose.Types.ObjectId(),
      month,
      amount: parsed.data.amount,
      category,
      createdAt: now,
      updatedAt: now,
    };
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $push: { budgets: snapshot } }
    ).exec();
    if (!result.modifiedCount) {
      return NextResponse.json({ error: 'Failed to add budget' }, { status: 500 });
    }
    const [withUsage] = await attachUsage(userId, [snapshot]);
    return NextResponse.json({ data: withUsage ?? snapshot }, { status: 201 });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
