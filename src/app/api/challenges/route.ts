import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Verify this path
import connectToDatabase from "@/lib/db";
import Challenge from "@/models/Challenge";
import { gamificationEngine } from "@/lib/gamification-engine";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();
        // 1. Update progress first
        // Note: In prod, this might be slow to do on every GET, but for now it's fine for "real-time" feel
        await gamificationEngine.updateProgress(session.user.email);

        const challenges = await Challenge.find({ userId: session.user.email }).sort({ status: 1, startDate: -1 });

        return NextResponse.json({ challenges });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { type } = await req.json();
        if (!type) return NextResponse.json({ error: "Type required" }, { status: 400 });

        await connectToDatabase();

        // Check if user already has this type active? done in engine
        const challenge = await gamificationEngine.joinChallenge(session.user.email, type);

        return NextResponse.json({ challenge });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to join" }, { status: 500 });
    }
}
