import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/db';
import { transactionUpdateSchema } from '../../../../lib/validation';
import mongoose from 'mongoose';
import { requireUser } from '../../../../lib/auth-helpers';
import User from '../../../../models/User';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const txId = new mongoose.Types.ObjectId(id);
    const rows = await User.aggregate([
      { $match: { _id: userObjectId } },
      { $unwind: '$transactions' },
      { $match: { 'transactions._id': txId } },
      { $replaceRoot: { newRoot: '$transactions' } },
      { $limit: 1 },
    ]);
    const doc = rows[0];
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    const parsed = transactionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const txId = new mongoose.Types.ObjectId(id);
    // Determine current type to enforce business rule when converting to expense
    const currentRows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      { $match: { 'transactions._id': txId } },
      { $limit: 1 },
    ]);
    if (currentRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = currentRows[0].transactions as any;
    const newType = (parsed.data.type ?? existing.type) as 'income' | 'expense';
    if (newType === 'expense' && existing.type !== 'expense') {
      // ensure at least one other income exists
      const others = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $unwind: '$transactions' },
        { $match: { 'transactions.type': 'income', 'transactions._id': { $ne: txId } } },
        { $limit: 1 },
      ]);
      if (others.length === 0) {
        return NextResponse.json(
          { error: 'At least one income must remain. Add another income before converting this to an expense.' },
          { status: 400 }
        );
      }
    }

    const update: any = { 'transactions.$[t].updatedAt': new Date() };
    for (const k of ['type','amount','description','category','account','date'] as const) {
      if ((parsed.data as any)[k] !== undefined) update[`transactions.$[t].${k}`] = (parsed.data as any)[k];
    }
    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: update },
      { arrayFilters: [{ 't._id': txId }] as any }
    ).exec();

    const outRows = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$transactions' },
      { $match: { 'transactions._id': txId } },
      { $replaceRoot: { newRoot: '$transactions' } },
      { $limit: 1 },
    ]);
    return NextResponse.json({ data: outRows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const txId = new mongoose.Types.ObjectId(id);
    const result = await User.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $pull: { transactions: { _id: txId } } }).exec();
    if (!result.modifiedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
