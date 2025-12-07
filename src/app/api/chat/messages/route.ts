import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/auth-helpers";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        const userId = await requireUser();
        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId"); // This is now the friend's userId

        if (!conversationId) {
            return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findById(userId).select("friends");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const friend = user.friends.find((f: any) => f.userId.toString() === conversationId);

        if (!friend) {
            console.log(`[Message API] Friend not found for conversationId: ${conversationId}`);
            return NextResponse.json({ messages: [] });
        }

        console.log(`[Message API] Found ${friend.messages?.length || 0} messages for friend ${conversationId}`);
        return NextResponse.json({ messages: friend.messages || [] });
    } catch (error) {
        console.error("Fetch messages error:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const userId = await requireUser();
        const { conversationId, content, type, fileUrl } = await req.json(); // conversationId is the recipient's userId

        if (!conversationId || (!content && !fileUrl)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findById(userId);
        const recipient = await User.findById(conversationId);

        if (!user || !recipient) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const newMessage = {
            _id: new mongoose.Types.ObjectId(),
            sender: userId,
            content: content || "",
            type: type || "text",
            fileUrl,
            createdAt: new Date(),
            read: false,
            conversationId // Add this for frontend compatibility
        };

        // Add to sender's friends list
        // Add to sender's friends list
        const senderFriendIndex = user.friends.findIndex((f: any) => f.userId.toString() === conversationId);
        console.log(`[Message API] Sender friend index: ${senderFriendIndex}`);

        if (senderFriendIndex > -1) {
            if (!user.friends[senderFriendIndex].messages) {
                user.friends[senderFriendIndex].messages = [];
            }
            user.friends[senderFriendIndex].messages.push(newMessage);
        } else {
            console.log(`[Message API] Creating new friend entry for sender`);
            user.friends.push({
                userId: recipient._id,
                name: recipient.name,
                image: recipient.avatar,
                username: recipient.username,
                messages: [newMessage]
            });
        }

        user.markModified('friends');
        try {
            await user.save();
            console.log(`[Message API] Saved to sender's DB`);
        } catch (err) {
            console.error(`[Message API] Failed to save sender:`, err);
        }

        // Add to recipient's friends list
        const recipientFriendIndex = recipient.friends.findIndex((f: any) => f.userId.toString() === userId);
        console.log(`[Message API] Recipient friend index: ${recipientFriendIndex}`);

        if (recipientFriendIndex > -1) {
            if (!recipient.friends[recipientFriendIndex].messages) {
                recipient.friends[recipientFriendIndex].messages = [];
            }
            recipient.friends[recipientFriendIndex].messages.push(newMessage);
        } else {
            console.log(`[Message API] Creating new friend entry for recipient`);
            recipient.friends.push({
                userId: user._id,
                name: user.name,
                image: user.avatar,
                username: user.username,
                messages: [newMessage]
            });
        }

        recipient.markModified('friends');
        try {
            await recipient.save();
            console.log(`[Message API] Saved to recipient's DB`);
        } catch (err) {
            console.error(`[Message API] Failed to save recipient:`, err);
        }

        // Populate sender details for the response (to match frontend expectation)
        const populatedMessage = {
            ...newMessage,
            sender: {
                _id: user._id,
                name: user.name,
                image: user.avatar
            }
        };

        return NextResponse.json({ message: populatedMessage });
    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
