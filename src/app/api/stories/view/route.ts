import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Story from "@/models/Story";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storyId } = await req.json();
        if (!storyId) {
            return NextResponse.json({ error: "Story ID required" }, { status: 400 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check if storyId is a valid ObjectId (24 char hex string)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(storyId);

        if (!isValidObjectId) {
            // It's a virtual story (e.g., 'error_fallback', 'welcome', 'briefing')
            // No need to update DB.
            return NextResponse.json({ success: true });
        }

        // Update Story: Add user to viewers if not already present
        // The viewers array contains ObjectIds.
        await Story.findByIdAndUpdate(
            storyId,
            {
                $addToSet: { viewers: user._id }
            }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Mark view error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
