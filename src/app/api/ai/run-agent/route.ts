import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiAgent } from "@/lib/ai-agent";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.email;

        // Run the agent
        await aiAgent.runAgent(userId);

        return NextResponse.json({ success: true, message: "Agent run completed successfully" });
    } catch (error: any) {
        console.error("Agent Run Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
