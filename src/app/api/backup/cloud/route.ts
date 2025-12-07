import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import Backup from '@/models/Backup';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// GET: Fetch encrypted cloud backup
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const { searchParams } = new URL(req.url);
        const infoOnly = searchParams.get('info') === 'true';

        const query = Backup.findOne({ userId }).sort({ createdAt: -1 });

        if (infoOnly) {
            query.select('createdAt encryptionMethod');
        }

        const backup = await query;

        if (!backup) {
            return NextResponse.json({ error: 'No backup found' }, { status: 404 });
        }

        if (infoOnly) {
            return NextResponse.json({
                timestamp: backup.createdAt,
                encryptionMethod: backup.encryptionMethod || 'user'
            });
        }

        return NextResponse.json({
            data: backup.data,
            timestamp: backup.createdAt,
            encryptionMethod: backup.encryptionMethod || 'user'
        });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error fetching cloud backup' }, { status: 500 });
    }
}
