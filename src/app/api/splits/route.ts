import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { requireUser } from '../../../lib/auth-helpers';
import User from '../../../models/User';
import mongoose from 'mongoose';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Get amounts others owe ME (from my transactions)
        const myUser = await User.findById(userObjectId).lean();
        const owedToMe = [];

        if (myUser.transactions) {
            for (const tx of myUser.transactions) {
                if (tx.split && tx.split.length > 0) {
                    for (const split of tx.split) {
                        if (!split.isSettled) {
                            owedToMe.push({
                                ...split,
                                txDate: tx.date,
                                txDesc: tx.description || tx.category,
                                txId: tx._id
                            });
                        }
                    }
                }
            }
        }

        // 2. Get amounts I owe OTHERS (from their transactions)
        // Find users who have transactions with split.userId == myId
        const usersWithSplits = await User.find({
            "transactions.split.userId": userObjectId,
            "transactions.split.isSettled": false
        }).lean();

        const iOwe = [];

        for (const otherUser of usersWithSplits) {
            for (const tx of otherUser.transactions) {
                if (tx.split) {
                    for (const split of tx.split) {
                        if (split.userId && split.userId.toString() === userId && !split.isSettled) {
                            iOwe.push({
                                amount: split.amount,
                                toUserId: otherUser._id,
                                toName: otherUser.name,
                                toUsername: otherUser.username,
                                txDate: tx.date,
                                txDesc: tx.description || tx.category,
                                txId: tx._id, // Needed to settle
                                splitId: split._id // Needed to settle
                            });
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            data: {
                owedToMe,
                iOwe
            }
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

// Endpoint to Settle Up (Mark as paid)
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        const body = await req.json();
        const { ownerId, txId, splitId } = body;

        // If ownerId is "me", use userId
        const targetOwnerId = ownerId === "me" ? userId : ownerId;

        // We need to find the user who owns the transaction
        const ownerObjectId = new mongoose.Types.ObjectId(targetOwnerId);

        // Update the specific split item to isSettled: true
        await User.updateOne(
            { _id: ownerObjectId, "transactions._id": txId },
            { $set: { "transactions.$[t].split.$[s].isSettled": true } },
            { arrayFilters: [{ "t._id": txId }, { "s._id": splitId }] }
        );

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json(
            { error: 'Database error', message: err?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
