import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
    try {
        const userId = await requireUser();
        await connectToDatabase();

        // Fetch current user with friends populated
        const user = await User.findById(userId).select("friends");

        if (!user) {
            console.log(`[Friends API] User ${userId} not found`);
            return NextResponse.json({ friends: [] });
        }

        const friendsList = user.friends || [];
        console.log(`[Friends API] User ${userId} has ${friendsList.length} friends in list`);

        // Extract userIds
        const friendIds = friendsList
            .map((f: any) => f.userId)
            .filter((id: any) => id);

        console.log(`[Friends API] Extracting IDs:`, friendIds);

        // Fetch details of friends from User collection
        // We select both avatar and image to be safe, though schema uses avatar
        const friendDetails = await User.find({ _id: { $in: friendIds } })
            .select("name email avatar image username");

        console.log(`[Friends API] Found ${friendDetails.length} details in DB`);

        // Create a map for quick lookup
        const friendMap = new Map(friendDetails.map((f: any) => [f._id.toString(), f]));

        // Combine embedded info with fetched info
        const results = friendsList.map((f: any) => {
            const userIdStr = f.userId ? f.userId.toString() : null;
            if (!userIdStr) {
                console.log(`[Friends API] Skipping friend with no userId:`, f);
                return null;
            }

            const details = friendMap.get(userIdStr);

            if (details) {
                return {
                    _id: details._id,
                    name: details.name,
                    email: details.email,
                    // Map avatar to image for frontend compatibility
                    image: details.avatar || details.image || null,
                    username: details.username
                };
            }

            console.log(`[Friends API] User ${userIdStr} not found in DB, using fallback`);
            // Fallback if user not found in DB (but exists in friends list)
            return {
                _id: f.userId,
                name: f.name || f.username || "Unknown Friend",
                email: "",
                image: null,
                username: f.username
            };
        }).filter(Boolean);

        console.log(`[Friends API] Returning ${results.length} friends`);
        return NextResponse.json({ friends: results });

    } catch (error) {
        console.error("Fetch friends error:", error);
        return NextResponse.json(
            { error: "Failed to fetch friends" },
            { status: 500 }
        );
    }
}
