import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { requireUser } from '../../../lib/auth-helpers';
import User from '../../../models/User';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const user = await User.findById(userObjectId).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data: user.friends || [] });
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
        const usernameToAdd = (body.username || '').trim().toLowerCase();

        if (!usernameToAdd) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Find the friend
        const friend = await User.findOne({ username: usernameToAdd });
        if (!friend) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (friend._id.toString() === userId) {
            return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 });
        }

        // Check if already friends
        const user = await User.findById(userObjectId);
        const alreadyFriend = user.friends.some((f: any) => f.userId.toString() === friend._id.toString());

        if (alreadyFriend) {
            return NextResponse.json({ error: 'Already friends' }, { status: 400 });
        }

        // Add friend to user's list
        await User.updateOne(
            { _id: userObjectId },
            {
                $push: {
                    friends: {
                        userId: friend._id,
                        username: friend.username,
                        name: friend.name
                    }
                }
            }
        );

        // Optional: Add user to friend's list (mutual friendship)
        // For now, let's keep it one-way or simple add. Mutual is better for splitting.
        // Let's make it mutual for simplicity in finding each other.
        await User.updateOne(
            { _id: friend._id },
            {
                $push: {
                    friends: {
                        userId: userObjectId,
                        username: user.username,
                        name: user.name
                    }
                }
            }
        );

        return NextResponse.json({ success: true, data: { userId: friend._id, username: friend.username, name: friend.name } });
    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
