import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import User from '@/models/User';
import { nanoid } from 'nanoid';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// GET: Get my invite code
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const user = await User.findById(userId);

        if (!user.inviteCode) {
            user.inviteCode = nanoid(6).toUpperCase();
            await user.save();
        }

        return NextResponse.json({
            inviteCode: user.inviteCode,
            partnerName: user.partnerName,
            partnerId: user.partnerId
        });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error fetching partner info' }, { status: 500 });
    }
}

// POST: Link account
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const { code } = await req.json();

        if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

        const me = await User.findById(userId);
        if (me.partnerId) return NextResponse.json({ error: 'Already linked' }, { status: 400 });

        const partner = await User.findOne({ inviteCode: code });
        if (!partner) return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
        if (partner._id.toString() === userId) return NextResponse.json({ error: 'Cannot link to yourself' }, { status: 400 });
        if (partner.partnerId) return NextResponse.json({ error: 'Partner already linked' }, { status: 400 });

        // Link both
        me.partnerId = partner._id;
        me.partnerName = partner.name;

        partner.partnerId = me._id;
        partner.partnerName = me.name;

        await Promise.all([me.save(), partner.save()]);

        return NextResponse.json({ success: true, partnerName: partner.name });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error linking account' }, { status: 500 });
    }
}

// DELETE: Unlink account
export async function DELETE(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const me = await User.findById(userId);

        if (me.partnerId) {
            const partner = await User.findById(me.partnerId);
            if (partner) {
                partner.partnerId = undefined;
                partner.partnerName = undefined;
                await partner.save();
            }
            me.partnerId = undefined;
            me.partnerName = undefined;
            await me.save();
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: 'Error unlinking account' }, { status: 500 });
    }
}
