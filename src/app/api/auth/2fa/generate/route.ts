import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, "Spends App", secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        return NextResponse.json({ secret, qrCodeUrl });
    } catch (error) {
        console.error("2FA Generate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
