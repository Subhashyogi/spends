import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Goal from "@/models/Goal";
import { goalPlanner } from "@/lib/goal-planner";
import connectToDatabase from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userEmail = session.user.email;

        await connectToDatabase();
        const goals = await Goal.find({ userId: session.user.email });

        // Enrich with analysis
        const enrichedGoals = await Promise.all(goals.map(async (g) => {
            const analysis = await goalPlanner.analyzeGoal(userEmail, g._id);
            return { ...g.toObject(), analysis };
        }));

        return NextResponse.json(enrichedGoals);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        await connectToDatabase();

        const goal = await Goal.create({
            userId: session.user.email,
            ...body
        });

        return NextResponse.json(goal);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
