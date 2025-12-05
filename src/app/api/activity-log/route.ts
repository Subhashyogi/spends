import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import ActivityLog from '@/models/ActivityLog';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        const logs = await ActivityLog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50) // Limit to last 50 actions
            .lean();

        return NextResponse.json({ data: logs });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error fetching activity logs' }, { status: 500 });
    }
}
