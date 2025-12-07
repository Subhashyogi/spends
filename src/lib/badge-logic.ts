import User from '@/models/User';
import { BADGES } from './badges';
import mongoose from 'mongoose';

export async function checkAndAwardBadges(userId: string) {
    try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const user = await User.findById(userObjectId);
        if (!user) return [];

        const unlockedBadgeIds = new Set((user.badges || []).map((b: any) => b.id));
        const newUnlocks: any[] = [];
        const userData = user.toObject();

        for (const badge of BADGES) {
            if (!unlockedBadgeIds.has(badge.id)) {
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

        return newUnlocks.map(u => u.id);
    } catch (error) {
        console.error('Error in checkAndAwardBadges:', error);
        return [];
    }
}
