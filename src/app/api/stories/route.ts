import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storiesGenerator } from "@/lib/stories-generator";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const slides = await storiesGenerator.generate(session.user.email);
        return NextResponse.json({ slides });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
