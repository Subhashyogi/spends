import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Story from "@/models/Story";
import connectToDatabase from "@/lib/db";
import { addHours } from "date-fns";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, color, type, title, subtext, icon } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const newStory = await Story.create({
            userId: user._id,
            type: type || 'text',
            content,
            title,
            subtext,
            icon,
            color: color || 'from-blue-500 to-indigo-600',
            expiresAt: addHours(new Date(), 24)
        });

        return NextResponse.json({ success: true, story: newStory });

    } catch (error: any) {
        console.error("Create story error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
