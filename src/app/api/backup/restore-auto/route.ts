import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import Budget from '@/models/Budget';
import Goal from '@/models/Goal';
import Backup from '@/models/Backup';
import { decryptServerData } from '@/lib/server-encryption';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        // 1. Fetch latest auto backup
        const backup = await Backup.findOne({
            userId,
            backupType: 'auto',
            encryptionMethod: 'system'
        }).sort({ createdAt: -1 });

        if (!backup) {
            return NextResponse.json({ error: 'No auto-backup found' }, { status: 404 });
        }

        // 2. Decrypt
        let data;
        try {
            data = decryptServerData(backup.data);
        } catch (e) {
            console.error("Decryption failed:", e);
            return NextResponse.json({ error: 'Failed to decrypt backup' }, { status: 500 });
        }

        if (!data || !data.version) {
            return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 });
        }

        // 3. Restore (Clear and Insert)
        await Promise.all([
            Transaction.deleteMany({ userId }),
            Category.deleteMany({ userId }),
            Budget.deleteMany({ userId }),
            Goal.deleteMany({ userId }),
        ]);

        if (data.transactions?.length) await Transaction.insertMany(data.transactions);
        if (data.categories?.length) await Category.insertMany(data.categories);
        if (data.budgets?.length) await Budget.insertMany(data.budgets);
        if (data.goals?.length) await Goal.insertMany(data.goals);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Auto restore error:", err);
        return NextResponse.json({ error: 'Error restoring backup' }, { status: 500 });
    }
}
