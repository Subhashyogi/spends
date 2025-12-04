import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/db';
import Category from '../../../../models/Category';
import { categoryUpdateSchema } from '../../../../lib/validation';
import mongoose from 'mongoose';
import { requireUser } from '../../../../lib/auth-helpers';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const doc = await Category.findOne({ _id: id, userId });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: doc });
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
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    const exists = parsed.data.name && parsed.data.type ? await Category.findOne({ userId, type: parsed.data.type, name: parsed.data.name, _id: { $ne: id } }) : null;
    if (exists) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    const doc = await Category.findOneAndUpdate({ _id: id, userId }, parsed.data, { new: true });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: doc });
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
    const doc = await Category.findOneAndDelete({ _id: id, userId });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}
