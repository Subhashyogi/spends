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

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();

        // Support both single object and array
        const items = Array.isArray(body) ? body : [body];

        if (items.length === 0) {
            return NextResponse.json({ message: 'No items to add' });
        }

        const logs = items.map(item => ({
            userId,
            action: item.action || 'UPDATE',
            entity: item.entity || 'SYSTEM',
            details: item.details || 'Manual log entry',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        }));

        // 1. Add to ActivityLog collection
        await ActivityLog.insertMany(logs);

        // 2. Add to User.activityLogs array
        // We use $push with $each to append multiple items
        const userLogs = logs.map(l => ({
            action: l.action,
            entity: l.entity,
            details: l.details,
            createdAt: l.createdAt
        }));

        const { models } = await import('mongoose');
        await models.User.updateOne(
            { _id: userId },
            { $push: { activityLogs: { $each: userLogs } } }
        );

        return NextResponse.json({ success: true, count: logs.length });
    } catch (err: any) {
        console.error("Error adding logs:", err);
        return NextResponse.json({ error: 'Error adding activity logs', details: err.message }, { status: 500 });
    }
}
