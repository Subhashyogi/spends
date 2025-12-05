import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { requireUser } from '../../../lib/auth-helpers';
import Goal from '../../../models/Goal';
import mongoose from 'mongoose';
import { z } from 'zod';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const goalSchema = z.object({
    name: z.string().min(1, "Name is required"),
    targetAmount: z.number().min(1, "Target amount must be positive"),
    currentAmount: z.number().min(0).default(0),
    deadline: z.string().optional().nullable(),
    color: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json({ data: goals });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error fetching goals' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const parsed = goalSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }

        const goal = await Goal.create({
            ...parsed.data,
            userId,
            deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
        });

        return NextResponse.json({ data: goal }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error creating goal' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const { _id, ...updates } = body;

        if (!_id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const parsed = goalSchema.partial().safeParse(updates);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }

        const goal = await Goal.findOneAndUpdate(
            { _id, userId },
            { $set: parsed.data },
            { new: true }
        );

        if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

        return NextResponse.json({ data: goal });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error updating goal' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const res = await Goal.deleteOne({ _id: id, userId });
        if (res.deletedCount === 0) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error deleting goal' }, { status: 500 });
    }
}
