import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const body = await req.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        const user = await User.findById(userId).select('passwordHash').lean();

        if (!user || !user.passwordHash) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (isValid) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: 'Error verifying password' }, { status: 500 });
    }
}
