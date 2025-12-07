import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// GET: Check if PIN is set
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const user = await User.findById(userId).select('appPin').lean();

        return NextResponse.json({
            hasPin: !!user?.appPin
        });
    } catch (err: any) {
        console.error("PIN API Error:", err);
        return NextResponse.json({ error: 'Error fetching PIN status' }, { status: 500 });
    }
}

// POST: Set or Update PIN
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const { pin } = body;

        if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
            return NextResponse.json({ error: 'Invalid PIN. Must be 4 digits.' }, { status: 400 });
        }

        const hashedPin = await bcrypt.hash(pin, 10);

        await User.updateOne(
            { _id: userId },
            { $set: { appPin: hashedPin } }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error setting PIN' }, { status: 500 });
    }
}

// PUT: Verify PIN
export async function PUT(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const { pin } = body;

        const user = await User.findById(userId).select('appPin').lean();

        if (!user?.appPin) {
            return NextResponse.json({ error: 'PIN not set' }, { status: 400 });
        }

        const isValid = await bcrypt.compare(pin, user.appPin);

        if (isValid) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: 'Error verifying PIN' }, { status: 500 });
    }
}

// DELETE: Remove PIN
export async function DELETE(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        await User.updateOne(
            { _id: userId },
            { $unset: { appPin: "" } }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error removing PIN' }, { status: 500 });
    }
}
