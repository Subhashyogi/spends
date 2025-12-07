"use client";

import { useState } from "react";
import ChatSidebar from "./chat-sidebar";
import ChatWindow from "./chat-window";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChatLayout() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
            {/* Floating Back Button - Hide on mobile when chat is open */}
            <Link
                href="/"
                className={`fixed left-4 top-4 z-50 rounded-full bg-zinc-800/50 p-2 text-zinc-400 backdrop-blur-md transition hover:bg-zinc-800 hover:text-white ${selectedConversationId ? "hidden md:flex" : "flex"}`}
                title="Back to Dashboard"
            >
                <ArrowLeft className="h-5 w-5" />
            </Link>

            {/* Sidebar - Hidden on mobile if chat is open */}
            <div className={`${selectedConversationId ? "hidden md:flex" : "flex"} h-full w-full md:w-auto flex-col border-r border-zinc-200 dark:border-zinc-800`}>
                <ChatSidebar
                    onSelectConversation={setSelectedConversationId}
                    selectedConversationId={selectedConversationId}
                />
            </div>

            {/* Chat Window - Full screen on mobile if chat is open */}
            <div className={`flex-1 flex-col ${selectedConversationId ? "flex" : "hidden md:flex"}`}>
                {selectedConversationId ? (
                    <ChatWindow
                        conversationId={selectedConversationId}
                        onBack={() => setSelectedConversationId(undefined)}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-[#222e35] text-zinc-400">
                        <div className="rounded-full bg-zinc-800 p-8 mb-4">
                            <svg className="h-16 w-16 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-zinc-300">Spends Web</h3>
                        <p className="mt-2 text-sm text-zinc-500">Send and receive messages without keeping your phone online.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
