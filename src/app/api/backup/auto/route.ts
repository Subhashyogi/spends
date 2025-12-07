import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import Budget from '@/models/Budget';
import Goal from '@/models/Goal';
import Backup from '@/models/Backup';
import { encryptServerData } from '@/lib/server-encryption';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        // 1. Check if auto-backup exists for this week
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Go to Sunday

        const existingBackup = await Backup.findOne({
            userId,
            backupType: 'auto',
            createdAt: { $gte: startOfWeek }
        });

        if (existingBackup) {
            return NextResponse.json({ skipped: true, message: 'Auto backup already exists for this week' });
        }

        // 2. Fetch data
        const [user, transactions, categories, budgets, goals] = await Promise.all([
            User.findById(userId).lean(),
            Transaction.find({ userId }).lean(),
            Category.find({ userId }).lean(),
            Budget.find({ userId }).lean(),
            Goal.find({ userId }).lean(),
        ]);

        const backupData = {
            user: { ...user, passwordHash: undefined, appPin: undefined },
            transactions,
            categories,
            budgets,
            goals,
            timestamp: new Date().toISOString(),
            version: "1.0",
            isAuto: true
        };

        // 3. Encrypt with Server Key
        const encryptedData = encryptServerData(backupData);

        // 4. Save
        await Backup.create({
            userId,
            data: encryptedData,
            backupType: 'auto',
            encryptionMethod: 'system',
            createdAt: new Date()
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Auto backup error:", err);
        return NextResponse.json({ error: 'Error creating auto backup' }, { status: 500 });
    }
}
