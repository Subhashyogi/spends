"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { socket } from "@/lib/socket";

type User = {
    _id: string;
    name: string;
    email: string;
    image?: string;
    username?: string;
};

type Conversation = {
    _id: string;
    participants: User[];
    lastMessage?: {
        content: string;
        type: string;
        createdAt: string;
    };
    updatedAt: string;
};

export default function ChatSidebar({
    onSelectConversation,
    selectedConversationId,
}: {
    onSelectConversation: (id: string) => void;
    selectedConversationId?: string;
}) {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [friends, setFriends] = useState<User[]>([]);



    // ... inside component
    useEffect(() => {
        fetchConversations();
        fetchFriends();

        socket.connect();

        socket.on("receive_message", () => {
            fetchConversations();
        });

        return () => {
            socket.off("receive_message");
            socket.disconnect();
        };
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/chat/conversations");
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const fetchFriends = async () => {
        try {
            const res = await fetch("/api/friends");
            const data = await res.json();
            if (data.friends) {
                setFriends(data.friends);
            }
        } catch (error) {
            console.error("Failed to fetch friends", error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.users) {
                setSearchResults(data.users);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const startConversation = async (participantId: string) => {
        try {
            const res = await fetch("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId }),
            });
            const data = await res.json();
            if (data.conversation) {
                onSelectConversation(data.conversation._id);
                setSearchQuery("");
                setSearchResults([]);
                fetchConversations();
            }
        } catch (error) {
            console.error("Failed to start conversation", error);
        }
    };

    const getOtherParticipant = (conversation: Conversation) => {
        const userId = (session?.user as any)?.id;
        if (!userId || !conversation?.participants) return null;
        return conversation.participants.find((p) => p && p._id !== userId);
    };

    return (
        <div className="flex h-full w-full md:w-80 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                {/* Header with padding-left to avoid overlap with fixed back button */}
                <div className="flex items-center justify-between mb-4 pl-12">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Spends</h2>
                    <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full rounded-lg bg-zinc-100 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                    <div className="p-2">
                        <h3 className="px-2 py-1 text-xs font-semibold text-zinc-500 uppercase">Search Results</h3>
                        {searchResults.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => startConversation(user._id)}
                                className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                    {user.image ? (
                                        <Image src={user.image} alt={user.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                            <UserIcon />
                                        </div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                                    <p className="text-xs text-zinc-500">{user.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {/* Active Conversations */}
                        {conversations.length > 0 && (
                            <div className="mb-4">
                                {/* Recent Chats Header Removed */}
                                {conversations.map((conv) => {
                                    const otherUser = getOtherParticipant(conv);
                                    if (!otherUser) return null;

                                    const isSelected = selectedConversationId === conv._id;

                                    return (
                                        <button
                                            key={conv._id}
                                            onClick={() => onSelectConversation(conv._id)}
                                            className={`flex w-full items-center gap-3 rounded-lg p-3 transition ${isSelected
                                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                }`}
                                        >
                                            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
                                                {otherUser.image ? (
                                                    <Image src={otherUser.image} alt={otherUser.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                        <UserIcon />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex justify-between items-baseline">
                                                    <p className={`font-medium truncate ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                                                        {otherUser.name}
                                                    </p>
                                                    {conv.lastMessage && (
                                                        <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-2">
                                                            {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-zinc-500 truncate">
                                                    {conv.lastMessage ? (
                                                        conv.lastMessage.type === 'text' ? conv.lastMessage.content : `Sent a ${conv.lastMessage.type}`
                                                    ) : (
                                                        "Start a conversation"
                                                    )}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Friends List (Filtered) */}
                        <div>
                            {friends
                                .filter(friend => !conversations.some(conv =>
                                    conv.participants.some(p => p._id === friend._id)
                                ))
                                .map((user) => (
                                    <button
                                        key={user._id}
                                        onClick={() => startConversation(user._id)}
                                        className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
                                            {user.image ? (
                                                <Image src={user.image} alt={user.name} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                    <UserIcon />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                                            <p className="text-sm text-zinc-500">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function UserIcon() {
    return (
        <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
        </svg>
    );
}
