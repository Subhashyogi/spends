import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import Budget from '@/models/Budget';
import Goal from '@/models/Goal';
import Backup from '@/models/Backup';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// GET: Fetch all user data for backup
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        // Fetch all related data
        const [user, transactions, categories, budgets, goals] = await Promise.all([
            User.findById(userId).lean(),
            Transaction.find({ userId }).lean(),
            Category.find({ userId }).lean(),
            Budget.find({ userId }).lean(),
            Goal.find({ userId }).lean(),
        ]);

        const backupData = {
            user: { ...user, passwordHash: undefined, appPin: undefined }, // Exclude sensitive auth data
            transactions,
            categories,
            budgets,
            goals,
            timestamp: new Date().toISOString(),
            version: "1.0"
        };

        return NextResponse.json({ data: backupData });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error fetching backup data' }, { status: 500 });
    }
}

// POST: Upload encrypted backup to cloud
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const { encryptedData } = body;

        if (!encryptedData) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }

        // Save backup (overwrite previous or create new - let's keep only latest for now to save space)
        // Or we can keep a history. Let's keep one per user for simplicity.
        await Backup.findOneAndUpdate(
            { userId },
            { data: encryptedData, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error uploading backup' }, { status: 500 });
    }
}

// PUT: Restore data from backup (This is dangerous, it overwrites current data)
export async function PUT(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const { data } = body; // Decrypted data object

        if (!data || !data.version) {
            return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 });
        }

        // Transactional restore would be ideal, but for now we'll do sequential deletes and inserts
        // 1. Clear existing data
        await Promise.all([
            Transaction.deleteMany({ userId }),
            Category.deleteMany({ userId }),
            Budget.deleteMany({ userId }),
            Goal.deleteMany({ userId }),
        ]);

        // 2. Insert new data
        // We need to ensure we don't overwrite _id if possible to keep references, 
        // but usually restoring means we want the exact state.
        // Mongoose insertMany accepts _id.

        if (data.transactions?.length) await Transaction.insertMany(data.transactions);
        if (data.categories?.length) await Category.insertMany(data.categories);
        if (data.budgets?.length) await Budget.insertMany(data.budgets);
        if (data.goals?.length) await Goal.insertMany(data.goals);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Error restoring backup' }, { status: 500 });
    }
}
