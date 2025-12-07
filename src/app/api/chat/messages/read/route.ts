import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/auth-helpers";

export async function POST(req: Request) {
    try {
        const userId = await requireUser();
        const { conversationId } = await req.json(); // conversationId is the friend's userId

        if (!conversationId) {
            return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findById(userId);
        const friend = await User.findById(conversationId);

        if (!user || !friend) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 1. Mark incoming messages from this friend as read in MY list (so I see them as read, though UI usually handles this)
        // Actually, "read" status usually matters for the SENDER to see that *I* read their messages.
        // So we need to update the SENDER's (friend's) copy of the messages to say "read: true".

        const friendIndex = friend.friends.findIndex((f: any) => f.userId.toString() === userId);
        if (friendIndex > -1 && friend.friends[friendIndex].messages) {
            let updated = false;
            friend.friends[friendIndex].messages.forEach((msg: any) => {
                if (msg.sender.toString() === conversationId && !msg.read) { // If message is from THEM and unread
                    msg.read = true;
                    updated = true;
                }
            });

            if (updated) {
                friend.markModified('friends');
                await friend.save();
            }
        }

        // Also update my copy just for consistency (optional, but good for sync)
        const myFriendIndex = user.friends.findIndex((f: any) => f.userId.toString() === conversationId);
        if (myFriendIndex > -1 && user.friends[myFriendIndex].messages) {
            let updated = false;
            user.friends[myFriendIndex].messages.forEach((msg: any) => {
                if (msg.sender.toString() === conversationId && !msg.read) {
                    msg.read = true;
                    updated = true;
                }
            });
            if (updated) {
                user.markModified('friends');
                await user.save();
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark read error:", error);
        return NextResponse.json(
            { error: "Failed to mark messages as read" },
            { status: 500 }
        );
    }
}
