import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storiesGenerator } from "@/lib/stories-generator";
import User from "@/models/User";
import Story from "@/models/Story";
import connectToDatabase from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 1. Get Auto-Generated Briefing
        const briefingSlides = await storiesGenerator.generate(user._id.toString());
        const briefingStory = briefingSlides.length > 0 ? {
            id: 'briefing',
            user: { name: 'Your Briefing', avatar: null, isBriefing: true },
            slides: briefingSlides,
            hasUnseen: true // Logic to track seen state is complex, simplistic for now
        } : null;

        // 2. Get User's Active Stories
        // Find stories where userId is user._id OR user.friends
        // We need friend IDs first
        const friendIds = user.friends.map((f: any) => f.userId);
        const relevantUserIds = [user._id, ...friendIds];

        const stories = await Story.find({
            userId: { $in: relevantUserIds },
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: 1 })
            .populate('userId', 'name avatar email username')
            .populate('viewers', 'name avatar'); // Populating the array of User IDs

        // Group by User
        const storiesByUser: Record<string, any> = {};

        stories.forEach((story: any) => {
            const uId = story.userId._id.toString();
            // Check if current user is in viewers list
            // story.viewers is now an array of populated User objects
            const isSeenByMe = story.viewers.some((v: any) => v._id.toString() === user._id.toString());

            if (!storiesByUser[uId]) {
                storiesByUser[uId] = {
                    id: uId,
                    user: {
                        name: story.userId.name,
                        username: story.userId.username,
                        avatar: story.userId.avatar,
                        isMe: uId === user._id.toString()
                    },
                    slides: [],
                    hasUnseen: false // Will update as we add slides
                };
            }

            if (!isSeenByMe) {
                storiesByUser[uId].hasUnseen = true;
            }

            storiesByUser[uId].slides.push({
                id: story._id.toString(),
                type: 'story', // User story type
                title: story.userId.name, // Header title
                value: story.content, // Text content
                subtext: new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: story.color,
                storyId: story._id,
                viewers: story.viewers.map((v: any) => ({
                    avatar: v.avatar
                })).filter((v: any) => v.avatar)
            });
        });

        // Format result: [AddStoryPlaceholder?, MyStory?, Briefing?, ...FriendsStories]
        const result = [];

        // My Story
        if (storiesByUser[user._id.toString()]) {
            result.push(storiesByUser[user._id.toString()]);
            delete storiesByUser[user._id.toString()];
        }

        // Briefing
        if (briefingStory) {
            result.push(briefingStory);
        }

        // Friends Stories
        Object.values(storiesByUser).forEach(s => result.push(s));

        return NextResponse.json({ stories: result });
    } catch (error: any) {
        console.error("Story generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
