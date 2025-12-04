import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import Category from '../../../models/Category';
import { categoryCreateSchema } from '../../../lib/validation';
import { requireUser } from '../../../lib/auth-helpers';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function seedIfEmpty(userId: string) {
  const count = await Category.countDocuments({ userId });
  if (count > 0) return;
  const presets = [
    // expense
    { userId, name: 'Food', type: 'expense', color: '#ef4444', icon: 'Utensils' },
    { userId, name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'Bus' },
    { userId, name: 'Travel', type: 'expense', color: '#06b6d4', icon: 'Plane' },
    { userId, name: 'Shopping', type: 'expense', color: '#10b981', icon: 'ShoppingCart' },
    { userId, name: 'Rent', type: 'expense', color: '#a855f7', icon: 'Home' },
    { userId, name: 'Bills', type: 'expense', color: '#f59e0b', icon: 'CreditCard' },
    { userId, name: 'Fees', type: 'expense', color: '#f97316', icon: 'Receipt' },
    { userId, name: 'Health', type: 'expense', color: '#22c55e', icon: 'Heart' },
    { userId, name: 'Other', type: 'expense', color: '#64748b', icon: 'Tag' },
    // income
    { userId, name: 'Salary', type: 'income', color: '#22c55e', icon: 'Coins' },
    { userId, name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'Briefcase' },
    { userId, name: 'Gift', type: 'income', color: '#f97316', icon: 'Gift' },
    { userId, name: 'Interest', type: 'income', color: '#06b6d4', icon: 'Banknote' },
    { userId, name: 'Other', type: 'income', color: '#64748b', icon: 'Plus' },
  ];
  await Category.bulkWrite(
    presets.map((c) => ({
      updateOne: {
        filter: { userId: c.userId, name: c.name, type: c.type },
        update: { $setOnInsert: c },
        upsert: true,
      },
    }))
  ).catch((e: any) => {
    if (e?.code === 11000) return; // ignore duplicate errors if concurrency happens
    throw e;
  });
}

export async function GET() {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    try { await seedIfEmpty(userId); } catch {}
    const data = await Category.find({ userId }).sort({ type: 1, name: 1 }).lean();
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
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const exists = await Category.findOne({ userId, type: parsed.data.type, name: parsed.data.name });
    if (exists) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    const doc = await Category.create({ ...parsed.data, userId });
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json(
      { error, message: err?.message || 'Unknown error' },
      { status }
    );
  }
}
