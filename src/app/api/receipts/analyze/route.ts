import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { receiptAI } from "@/lib/receipt-ai";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, manualItems } = await req.json();

        let items = manualItems || [];
        if (text) {
            items = receiptAI.parseReceiptText(text);
        }

        const insights = await receiptAI.analyzeItems(session.user.email, items);

        return NextResponse.json({ items, insights });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
