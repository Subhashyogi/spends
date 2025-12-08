import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
    try {
        const userId = await requireUser();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q")?.toLowerCase();

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] });
        }

        await connectToDatabase();

        // Fetch current user to check friends and requests
        const currentUser = await User.findById(userId)
            .select("friends friendRequests");

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Search for users matching the query
        // Exclude current user
        const users = await User.find({
            _id: { $ne: userId },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { username: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        })
            .select("name username email avatar image")
            .limit(20);

        console.log(`[Search API] Found ${users.length} users matching "${query}"`);

        const friendIds = new Set((currentUser.friends || []).map((f: any) => f.userId.toString()));

        // Check for outgoing pending requests
        const pendingRequestIds = new Set(
            (currentUser.friendRequests || [])
                .filter((r: any) => r.type === 'outgoing' && r.status === 'pending')
                .map((r: any) => r.userId.toString())
        );

        const results = users.map((user) => {
            const userIdStr = user._id.toString();
            return {
                id: userIdStr,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar || user.image,
                isFriend: friendIds.has(userIdStr),
                hasPendingRequest: pendingRequestIds.has(userIdStr)
            };
        });

        return NextResponse.json({ users: results });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Failed to search users" },
            { status: 500 }
        );
    }
}
