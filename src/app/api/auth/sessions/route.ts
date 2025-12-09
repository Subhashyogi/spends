import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UAParser } from "ua-parser-js";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email }).select('sessions');

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const currentSessionId = (session.user as any).sessionId;

        const sessions = (user.sessions || []).map((s: any) => {
            const parser = new UAParser(s.userAgent);
            const browser = parser.getBrowser();
            const os = parser.getOS();
            const device = parser.getDevice();

            return {
                sessionId: s.sessionId,
                device: `${device.vendor || ''} ${device.model || 'PC'}`,
                browser: `${browser.name} ${browser.version}`,
                os: `${os.name} ${os.version}`,
                ip: s.ip,
                lastActive: s.lastActive,
                isCurrent: s.sessionId === currentSessionId
            };
        });

        // Sort: current session first, then by last active
        sessions.sort((a: any, b: any) => {
            if (a.isCurrent) return -1;
            if (b.isCurrent) return 1;
            return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Sessions List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId, revokeAll } = await req.json();

        if (!sessionId && !revokeAll) {
            return NextResponse.json({ error: "Session ID or revokeAll required" }, { status: 400 });
        }

        await connectToDatabase();

        if (revokeAll) {
            await User.updateOne(
                { email: session.user.email },
                { $set: { sessions: [] } }
            );
        } else {
            await User.updateOne(
                { email: session.user.email },
                {
                    $pull: { sessions: { sessionId } }
                }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session Revoke Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
