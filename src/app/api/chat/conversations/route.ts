import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { requireUser } from "@/lib/auth-helpers";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        const userId = await requireUser();
        await connectToDatabase();

        const user = await User.findById(userId).select("friends");

        if (!user) {
            return NextResponse.json({ conversations: [] });
        }

        // Map friends to conversation format
        const conversations = user.friends.map((friend: any) => {
            // Find the last message
            const lastMsg = friend.messages && friend.messages.length > 0
                ? friend.messages[friend.messages.length - 1]
                : null;

            return {
                _id: friend.userId.toString(), // Use friend's userId as conversation ID for simplicity in this model
                participants: [
                    { _id: userId, name: user.name, image: user.avatar },
                    { _id: friend.userId, name: friend.name, image: friend.image }
                ],
                lastMessage: lastMsg,
                updatedAt: lastMsg ? lastMsg.createdAt : new Date()
            };
        });

        // Sort by last message date
        conversations.sort((a: any, b: any) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Fetch conversations error:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const userId = await requireUser();
        const { participantId } = await req.json();

        if (!participantId) {
            return NextResponse.json(
                { error: "Participant ID is required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findById(userId);
        const participant = await User.findById(participantId);

        if (!user || !participant) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if already friends
        const isFriend = user.friends.some((f: any) => f.userId.toString() === participantId);

        if (!isFriend) {
            // Add to friends list if not already there (simulating "starting a chat" = "adding friend" for now)
            // In a real app, you might want a separate "request" flow, but for this refactor we keep it simple
            user.friends.push({
                userId: participant._id,
                name: participant.name,
                image: participant.avatar,
                username: participant.username,
                messages: []
            });
            await user.save();

            // Also add current user to participant's friends
            const isParticipantFriend = participant.friends.some((f: any) => f.userId.toString() === userId);
            if (!isParticipantFriend) {
                participant.friends.push({
                    userId: user._id,
                    name: user.name,
                    image: user.avatar,
                    username: user.username,
                    messages: []
                });
                await participant.save();
            }
        }

        // Return conversation structure
        const conversation = {
            _id: participantId, // Using participantId as conversation ID
            participants: [
                { _id: userId, name: user.name, image: user.avatar },
                { _id: participant._id, name: participant.name, image: participant.avatar }
            ],
            updatedAt: new Date()
        };

        return NextResponse.json({ conversation });
    } catch (error) {
        console.error("Create conversation error:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}
