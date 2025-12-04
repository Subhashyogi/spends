import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/db';
import { budgetUpdateSchema } from '../../../../lib/validation';
import mongoose from 'mongoose';
import { requireUser } from '../../../../lib/auth-helpers';
import User from '../../../../models/User';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function monthRange(month: string) {
  const [y, m] = month.split('-').map((x) => parseInt(x, 10));
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { start, end };
}

async function computeUsage(userId: string, doc: any) {
  if (!doc) return null;
  const { start, end } = monthRange(doc.month);
  const matchInner: any = { 'transactions.type': 'expense', 'transactions.date': { $gte: start, $lte: end } };
  if (doc.category) matchInner['transactions.category'] = doc.category;
  const agg = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$transactions' },
    { $match: matchInner },
    { $group: { _id: null, total: { $sum: '$transactions.amount' } } },
  ]);
  const spent = agg[0]?.total ?? 0;
  const usedPct = doc.amount > 0 ? Math.min(100, Math.round((spent / doc.amount) * 100)) : 0;
  const status = spent >= doc.amount ? 'over' : usedPct >= 80 ? 'warning' : 'ok';
  return { ...doc.toObject?.() ?? doc, spent, usedPct, status };
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const rows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$budgets' },
      { $match: { 'budgets._id': new mongoose.Types.ObjectId(id) } },
      { $replaceRoot: { newRoot: '$budgets' } },
      { $limit: 1 },
    ]);
    const doc = rows[0];
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const out = await computeUsage(userId, doc);
    return NextResponse.json({ data: out });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json().catch(() => null);
    const parsed = budgetUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    // Enforce uniqueness of (month, category)
    if (parsed.data.month || parsed.data.category !== undefined) {
      const existingRows = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $unwind: '$budgets' },
        { $match: { 'budgets._id': new mongoose.Types.ObjectId(id) } },
        { $limit: 1 },
      ]);
      const current = existingRows[0]?.budgets || existingRows[0];
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const month = parsed.data.month ?? current.month;
      const category = (parsed.data.category ?? current.category) ?? null;
      const dup = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $unwind: '$budgets' },
        { $match: { 'budgets.month': month, 'budgets.category': category, 'budgets._id': { $ne: new mongoose.Types.ObjectId(id) } } },
        { $limit: 1 },
      ]);
      if (dup.length) return NextResponse.json({ error: 'Budget already exists for this month/category' }, { status: 409 });
    }

    const set: any = { 'budgets.$[b].updatedAt': new Date() };
    for (const k of ['month','amount','category'] as const) {
      if ((parsed.data as any)[k] !== undefined) set[`budgets.$[b].${k}`] = (parsed.data as any)[k];
    }
    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: set },
      { arrayFilters: [{ 'b._id': new mongoose.Types.ObjectId(id) }] as any }
    ).exec();
    const outRows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$budgets' },
      { $match: { 'budgets._id': new mongoose.Types.ObjectId(id) } },
      { $replaceRoot: { newRoot: '$budgets' } },
      { $limit: 1 },
    ]);
    const out = await computeUsage(userId, outRows[0]);
    return NextResponse.json({ data: out });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $pull: { budgets: { _id: new mongoose.Types.ObjectId(id) } } }
    ).exec();
    if (!result.modifiedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}
