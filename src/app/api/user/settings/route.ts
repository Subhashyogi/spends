import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

export async function GET() {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: (user as any).username,
      avatar: (user as any).avatar,
      friends: (user as any).friends || [],
      friendRequests: (user as any).friendRequests || [],
      friendsCount: Array.isArray((user as any).friends) ? (user as any).friends.length : 0,
      currency: (user as any).currency || 'INR',
      twoFactorEnabled: !!(user as any).twoFactorEnabled,
    });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();
    const body = await req.json().catch(() => null) as any;
    const update: any = {};
    if (typeof body?.name === 'string' && body.name.trim()) update.name = body.name.trim();
    if (typeof body?.avatar === 'string') update.avatar = body.avatar;
    if (typeof body?.currency === 'string') {
      const c = body.currency.trim().toUpperCase();
      if (!ALLOWED_CURRENCIES.includes(c)) {
        return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
      }
      update.currency = c;
    }
    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'No changes' }, { status: 400 });
    }
    console.log('Update payload:', update);
    await User.updateOne({ _id: userId }, { $set: update }, { strict: false }).exec();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? 'Unauthorized' : 'Database error';
    return NextResponse.json({ error, message: err?.message || 'Unknown error' }, { status });
  }
}
