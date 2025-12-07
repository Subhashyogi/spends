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
        const { targetUserId } = await req.json();

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
        }

        if (userId === targetUserId) {
            return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
        }

        const currentUser = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already friends
        const isFriend = (currentUser.friends || []).some((f: any) => f.userId.toString() === targetUserId);
        if (isFriend) {
            return NextResponse.json({ error: 'Already friends' }, { status: 400 });
        }

        // Check if request already exists
        const existingRequest = (currentUser.friendRequests || []).some(
            (r: any) => r.userId.toString() === targetUserId && r.status === 'pending'
        );
        if (existingRequest) {
            return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
        }

        // Add outgoing request to current user
        await User.updateOne(
            { _id: userId },
            {
                $push: {
                    friendRequests: {
                        userId: targetUser._id,
                        username: targetUser.username,
                        name: targetUser.name,
                        type: 'outgoing',
                        status: 'pending'
                    }
                }
            }
        );

        // Add incoming request to target user
        await User.updateOne(
            { _id: targetUserId },
            {
                $push: {
                    friendRequests: {
                        userId: currentUser._id,
                        username: currentUser.username,
                        name: currentUser.name,
                        type: 'incoming',
                        status: 'pending'
                    }
                }
            }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Friend request error:', err);
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
    }
}
