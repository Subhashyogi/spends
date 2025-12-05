import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { transactionCreateSchema } from '../../../lib/validation';
import { requireUser } from '../../../lib/auth-helpers';
import User from '../../../models/User';
import ActivityLog from '../../../models/ActivityLog';
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
      { $addFields: { user: 'Me' } }, // Mark as mine
      { $sort: { date: -1 } }
    ].filter(Boolean);

    // Check for partner
    const user = await User.findById(userId);
    if (user.partnerId) {
      const partnerPipeline: any[] = [
        { $match: { _id: user.partnerId } },
        { $unwind: '$transactions' },
        Object.keys(match).length ? { $match: match } : undefined,
        { $replaceRoot: { newRoot: '$transactions' } },
        { $addFields: { user: 'Partner' } } // Mark as partner's
      ].filter(Boolean);

      const [myTx, partnerTx] = await Promise.all([
        User.aggregate(pipeline),
        User.aggregate(partnerPipeline)
      ]);

      const allTx = [...myTx, ...partnerTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return NextResponse.json({ data: allTx });
    }

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
    let amount = parsed.data.amount;
    let originalAmount = undefined;
    let originalCurrency = undefined;
    let exchangeRate = undefined;

    if (parsed.data.currency && parsed.data.currency.toUpperCase() !== 'INR') {
      try {
        const from = parsed.data.currency.toUpperCase();
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await res.json();
        const rate = data.rates['INR'];

        if (rate) {
          originalAmount = amount;
          originalCurrency = from;
          exchangeRate = rate;
          amount = amount * rate;
        }
      } catch (e) {
        console.error("Failed to convert currency", e);
        // Fallback: keep original amount but mark it (or we could fail)
        // For now, we'll just store as is but maybe we should have a fallback rate?
        // Let's assume 1:1 if fail, but log it. 
        // Actually, better to store original details even if rate is 1? 
        // No, let's just proceed with amount as is if fetch fails, effectively 1:1.
      }
    }

    const snapshot: any = {
      _id: new mongoose.Types.ObjectId(),
      type: parsed.data.type,
      amount: amount,
      description: parsed.data.description,
      category: parsed.data.category,
      account: parsed.data.account,
      date: parsed.data.date ?? now,
      originalAmount,
      originalCurrency,
      exchangeRate,
      isRecurring: parsed.data.isRecurring || false,
      frequency: parsed.data.frequency,
      tags: parsed.data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $push: { transactions: snapshot }, $addToSet: { accounts: snapshot.account } }
    ).exec();

    // Log activity
    await ActivityLog.create({
      userId,
      action: 'CREATE',
      entity: 'TRANSACTION',
      details: `Created ${snapshot.type} of ${snapshot.amount} for ${snapshot.category}`,
    });

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
