import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { requireUser } from '../../../lib/auth-helpers';
import User from '../../../models/User';
import mongoose from 'mongoose';
import { BADGES } from '../../../lib/badges';

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

        const unlockedBadgeIds = new Set((user.badges || []).map((b: any) => b.id));

        const badgesWithStatus = BADGES.map(badge => ({
            ...badge,
            unlocked: unlockedBadgeIds.has(badge.id),
            unlockedAt: user.badges?.find((b: any) => b.id === badge.id)?.unlockedAt
        }));

        return NextResponse.json({ data: badgesWithStatus });
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

        // Fetch full user data to check conditions
        // We need transactions and budgets. 
        // Note: User.findById might not return everything if we don't project, but by default it does.
        // However, for complex checks (like savings across months), we need all transactions.
        const user = await User.findById(userObjectId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const unlockedBadgeIds = new Set((user.badges || []).map((b: any) => b.id));
        const newUnlocks: any[] = [];

        // Check each badge
        for (const badge of BADGES) {
            if (!unlockedBadgeIds.has(badge.id)) {
                // Pass user object (which has transactions, budgets etc) to check function
                // Note: Mongoose document might need to be converted to object for some checks if we used .lean(), 
                // but here 'user' is a document. The check functions expect array access.
                // Let's convert to object for safety.
                const userData = user.toObject();

                try {
                    if (badge.check(userData)) {
                        newUnlocks.push({
                            id: badge.id,
                            unlockedAt: new Date()
                        });
                    }
                } catch (e) {
                    console.error(`Error checking badge ${badge.id}:`, e);
                }
            }
        }

        if (newUnlocks.length > 0) {
            await User.updateOne(
                { _id: userObjectId },
                { $push: { badges: { $each: newUnlocks } } }
            );
        }

        return NextResponse.json({
            newUnlocks: newUnlocks.map(u => u.id),
            count: newUnlocks.length
        });

    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
