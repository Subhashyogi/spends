import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
    try {
        const userId = await requireUser();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q")?.toLowerCase();

        await connectToDatabase();

        // Fetch current user with friends populated
        const user = await User.findById(userId).select("friends");

        if (!user) {
            return NextResponse.json({ users: [] });
        }

        const friends = user.friends || [];
        console.log(`[Search API] Found ${friends.length} friends for user ${userId}`);

        const friendIds = friends.map((f: any) => f.userId);

        // Fetch details of friends from User collection
        const friendDetails = await User.find({ _id: { $in: friendIds } })
            .select("name email image avatar username");

        console.log(`[Search API] Found ${friendDetails.length} friend details in DB`);

        // Create a map for quick lookup
        const friendMap = new Map(friendDetails.map((f: any) => [f._id.toString(), f]));

        // Combine embedded info with fetched info (handling cases where user might be deleted)
        let results = friends.map((f: any) => {
            const found = friendMap.get(f.userId.toString());
            if (found) {
                return {
                    ...found.toObject(),
                    image: found.avatar || found.image // Ensure image is populated
                };
            }

            // Fallback to embedded details
            return {
                _id: f.userId,
                name: f.name || f.username || "Unknown Friend",
                email: "", // Email not stored in friends array
                image: null,
                username: f.username
            };
        });

        // Filter friends based on query
        if (query) {
            results = results.filter((friend: any) =>
                (friend.name && friend.name.toLowerCase().includes(query)) ||
                (friend.username && friend.username.toLowerCase().includes(query)) ||
                (friend.email && friend.email.toLowerCase().includes(query))
            );
        }

        return NextResponse.json({ users: results });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Failed to search users" },
            { status: 500 }
        );
    }
}
