import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const { requesterId } = await req.json();

        if (!requesterId) {
            return NextResponse.json({ error: 'Requester ID required' }, { status: 400 });
        }

        // Remove request from both users
        await User.updateOne(
            { _id: userId },
            { $pull: { friendRequests: { userId: new mongoose.Types.ObjectId(requesterId) } } }
        );

        await User.updateOne(
            { _id: requesterId },
            { $pull: { friendRequests: { userId: new mongoose.Types.ObjectId(userId) } } }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Reject request error:', err);
        return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }
}
