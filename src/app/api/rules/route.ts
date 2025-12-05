import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { requireUser } from '../../../lib/auth-helpers';
import User from '../../../models/User';
import mongoose from 'mongoose';
import { z } from 'zod';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const ruleSchema = z.object({
    name: z.string().min(1),
    condition: z.object({
        field: z.enum(['category', 'amount', 'time']),
        operator: z.enum(['equals', 'gt', 'lt']),
        value: z.any()
    }),
    action: z.object({
        type: z.enum(['tag', 'confirm', 'alert']),
        value: z.string().optional()
    }),
    enabled: z.boolean().default(true)
});

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const user = await User.findById(userObjectId).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data: user.rules || [] });
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
        const userId = await requireUser();
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const body = await req.json();
        const parsed = ruleSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
        }

        const newRule = {
            id: new mongoose.Types.ObjectId().toString(),
            ...parsed.data
        };

        await User.updateOne(
            { _id: userObjectId },
            { $push: { rules: newRule } }
        );

        return NextResponse.json({ data: newRule });
    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
        }

        await User.updateOne(
            { _id: userObjectId },
            { $pull: { rules: { id: id } } }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
