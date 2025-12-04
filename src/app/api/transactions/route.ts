import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { transactionCreateSchema } from '../../../lib/validation';
import { requireUser } from '../../../lib/auth-helpers';
import User from '../../../models/User';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const category = searchParams.get('category');
    const account = searchParams.get('account');
    const q = searchParams.get('q');

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match: any = {};
    if (type && (type === 'income' || type === 'expense')) match['transactions.type'] = type;
    if (category) match['transactions.category'] = category;
    if (account) match['transactions.account'] = account;
    if (from || to) {
      match['transactions.date'] = {} as any;
      if (from) (match['transactions.date'] as any).$gte = new Date(from);
      if (to) (match['transactions.date'] as any).$lte = new Date(to);
    }
    if (q && q.trim()) {
      match['transactions.description'] = { $regex: q.trim(), $options: 'i' };
    }

    const pipeline: any[] = [
      { $match: { _id: userObjectId } },
      { $unwind: '$transactions' },
      Object.keys(match).length ? { $match: match } : undefined,
      { $replaceRoot: { newRoot: '$transactions' } },
      { $sort: { date: -1, createdAt: -1 } },
    ].filter(Boolean);

    const data = await User.aggregate(pipeline);
    return NextResponse.json({ data });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json(
      { error, message: err?.message || 'Unknown error' },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = transactionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Business rule: cannot add expense until we have at least one income
    if (parsed.data.type === 'expense') {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const income = await User.aggregate([
        { $match: { _id: userObjectId } },
        { $unwind: '$transactions' },
        { $match: { 'transactions.type': 'income' } },
        { $limit: 1 },
      ]);
      if (income.length === 0) {
        return NextResponse.json(
          { error: 'Add an income before adding an expense' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const snapshot: any = {
      _id: new mongoose.Types.ObjectId(),
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description,
      category: parsed.data.category,
      account: parsed.data.account,
      date: parsed.data.date ?? now,
      createdAt: now,
      updatedAt: now,
    };

    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $push: { transactions: snapshot }, $addToSet: { accounts: snapshot.account } }
    ).exec();
    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json(
      { error, message: err?.message || 'Unknown error' },
      { status }
    );
  }
}
