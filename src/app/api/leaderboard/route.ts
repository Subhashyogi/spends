import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Challenge from "@/models/Challenge";
import { financialScore } from "@/lib/financial-score";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "world"; // 'world' | 'friends'
        const currentUserEmail = session.user.email;
        const currentUser = await User.findOne({ email: currentUserEmail });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let targetUserIds: string[] = [];

        if (type === 'friends') {
            const friendIds = new Set<string>();
            friendIds.add(currentUser._id.toString());

            if (currentUser.friends && Array.isArray(currentUser.friends)) {
                currentUser.friends.forEach((f: any) => {
                    if (f.userId) friendIds.add(f.userId.toString());
                });
            }
            targetUserIds = Array.from(friendIds);
        } else {
            // World: Fetch all users (limit 50)
            // In a real huge app, we'd have a pre-calculated 'xp' field. 
            // Here we calc on fly for top 50 users (or just random 50 if no huge scale yet)
            const allUsers = await User.find({}).select('_id').limit(50);
            targetUserIds = allUsers.map(u => u._id.toString());
        }

        // Now fetch details and calc scores for these users
        const users = await User.find({ _id: { $in: targetUserIds } }).select('name image username _id');

        const leaderboard = await Promise.all(users.map(async (u) => {
            // 1. Calculate Financial Score (0-100)
            // We catch errors to avoid crashing whole leaderboard
            let scoreData = { score: 0 };
            try {
                scoreData = await financialScore.calculate(u._id.toString());
            } catch (e) {
                console.error(`Error calculating score for ${u._id}`, e);
            }

            // 2. Count Completed Challenges
            const completedChallenges = await Challenge.countDocuments({
                userId: u._id,
                status: 'completed'
            });

            // 3. Total XP Formula
            const xp = (scoreData.score * 20) + (completedChallenges * 500);

            return {
                userId: u._id.toString(),
                name: u.name || u.username || 'Anonymous',
                image: u.image,
                score: xp, // This is the "XP" shown on UI
                me: u._id.toString() === currentUser._id.toString()
            };
        }));

        // Sort by XP Descending
        leaderboard.sort((a, b) => b.score - a.score);

        // Add Rank
        const rankedLeaderboard = leaderboard.map((item, index) => ({
            ...item,
            rank: index + 1
        }));

        return NextResponse.json({ leaderboard: rankedLeaderboard });

    } catch (error) {
        console.error("Leaderboard Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
