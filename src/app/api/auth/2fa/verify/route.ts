import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code, secret } = await req.json();
        if (!code || !secret) {
            return NextResponse.json({ error: "Missing code or secret" }, { status: 400 });
        }

        const { verifyTwoFactorCode } = await import("@/lib/twoFactor");
        const isValid = verifyTwoFactorCode(code, secret);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        await connectToDatabase();
        await User.updateOne(
            { email: session.user.email },
            {
                twoFactorEnabled: true,
                twoFactorSecret: secret
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("2FA Verify Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
