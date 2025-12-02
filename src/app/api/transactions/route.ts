import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import { transactionCreateSchema } from '../../../lib/validation';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const category = searchParams.get('category');

    const query: any = {};
    if (type && (type === 'income' || type === 'expense')) query.type = type;
    if (category) query.category = category;
    if (from || to) {
      query.date = {} as any;
      if (from) (query.date as any).$gte = new Date(from);
      if (to) (query.date as any).$lte = new Date(to);
    }

    const data = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

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
      const incomeCount = await Transaction.countDocuments({ type: 'income' });
      if (incomeCount === 0) {
        return NextResponse.json(
          { error: 'Add an income before adding an expense' },
          { status: 400 }
        );
      }
    }

    const doc = await Transaction.create({ ...parsed.data, date: parsed.data.date ?? new Date() });
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
