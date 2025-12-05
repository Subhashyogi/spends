import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => null) as { name?: string; email?: string; password?: string; username?: string } | null;
    const name = (body?.name || '').trim();
    const email = (body?.email || '').trim().toLowerCase();
    const username = (body?.username || '').trim().toLowerCase();
    const password = body?.password || '';

    if (!name || !email || !password || password.length < 6 || !username) {
      return NextResponse.json({ error: 'Invalid input. Username, name, email, and password (min 6 chars) are required.' }, { status: 400 });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      if (exists.email === email) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      if (exists.username === username) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const doc = await User.create({ name, email, username, passwordHash, transactions: [] });
    return NextResponse.json({ data: { id: doc._id.toString(), name: doc.name, email: doc.email, username: doc.username } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}
