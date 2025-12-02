import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/db';
import Transaction from '../../../../models/Transaction';
import { transactionUpdateSchema } from '../../../../lib/validation';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const doc = await Transaction.findById(id);
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

    const existing = await Transaction.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const newType = (parsed.data.type ?? existing.type) as 'income' | 'expense';
    if (newType === 'expense') {
      // If converting an existing income to expense, ensure at least one other income exists
      const incomeCountExcludingThis = await Transaction.countDocuments({ type: 'income', _id: { $ne: existing._id } });
      if (incomeCountExcludingThis === 0) {
        return NextResponse.json(
          { error: 'At least one income must remain. Add another income before converting this to an expense.' },
          { status: 400 }
        );
      }
    }

    const doc = await Transaction.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: doc });
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
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const doc = await Transaction.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Database error', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
