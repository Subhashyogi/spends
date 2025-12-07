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

        const { checkAndAwardBadges } = await import('../../../lib/badge-logic');
        const newUnlocks = await checkAndAwardBadges(userId);

        return NextResponse.json({
            newUnlocks,
            count: newUnlocks.length
        });

    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
