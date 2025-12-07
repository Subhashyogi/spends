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

        const currentUser = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!currentUser || !requester) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify pending incoming request
        const request = (currentUser.friendRequests || []).find(
            (r: any) => r.userId.toString() === requesterId && r.type === 'incoming' && r.status === 'pending'
        );

        if (!request) {
            return NextResponse.json({ error: 'No pending request found' }, { status: 404 });
        }

        // Add to friends list for both
        await User.updateOne(
            { _id: userId },
            {
                $push: {
                    friends: {
                        userId: requester._id,
                        username: requester.username,
                        name: requester.name
                    }
                },
                $pull: { friendRequests: { userId: requester._id } } // Remove request
            }
        );

        await User.updateOne(
            { _id: requesterId },
            {
                $push: {
                    friends: {
                        userId: currentUser._id,
                        username: currentUser.username,
                        name: currentUser.name
                    }
                },
                $pull: { friendRequests: { userId: currentUser._id } } // Remove request
            }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Accept request error:', err);
        return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
    }
}
