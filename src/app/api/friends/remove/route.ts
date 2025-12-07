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
        const { friendId } = await req.json();

        if (!friendId) {
            return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
        }

        // Remove friend from user's list
        await User.updateOne(
            { _id: userId },
            { $pull: { friends: { userId: new mongoose.Types.ObjectId(friendId) } } }
        );

        // Remove user from friend's list (mutual unfriend)
        await User.updateOne(
            { _id: friendId },
            { $pull: { friends: { userId: new mongoose.Types.ObjectId(userId) } } }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Unfriend error:", err);
        return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 });
    }
}
