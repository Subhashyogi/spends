"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StoryViewer from "./story-viewer";
import AddStoryModal from "./add-story-modal";
import { Zap, Plus, User as UserIcon } from "lucide-react";

export default function StoryTray() {
    const [storyGroups, setStoryGroups] = useState<any[]>([]); // Groups: { id, user, slides }
    const [viewingStoryId, setViewingStoryId] = useState<string | null>(null); // Group ID
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

    const loadStories = () => {
        fetch("/api/stories")
            .then(res => res.json())
            .then(data => {
                if (data.stories) {
                    setStoryGroups(data.stories);
                }
            })
            .catch(err => console.error("Failed to load stories", err));
    };

    useEffect(() => {
        loadStories();
    }, []);

    const activeStoryGroup = storyGroups.find(s => s.id === viewingStoryId);

    return (
        <>
            <div className="mb-6 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {/* Add Story Button */}
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="group relative flex flex-col items-center gap-2 flex-shrink-0"
                >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800/50">
                            <Plus className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <div className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1 border-2 border-white dark:border-black">
                            <Plus className="h-3 w-3 text-white" />
                        </div>
                    </div>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Add Story
                    </span>
                </button>

                {/* Story Circles */}
                {storyGroups.map((group) => {
                    const isBriefing = group.user.isBriefing;
                    const isMe = group.user.isMe;
                    const hasUnseen = group.hasUnseen && !viewedStoryIds.has(group.id);

                    return (
                        <button
                            key={group.id}
                            onClick={() => setViewingStoryId(group.id)}
                            className="group relative flex flex-col items-center gap-2 flex-shrink-0"
                        >
                            <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 ${hasUnseen ? 'border-transparent bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-[2px]' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900 border-2 border-white dark:border-black shadow-lg overflow-hidden">
                                    {isBriefing ? (
                                        <Zap className={`h-6 w-6 ${hasUnseen ? 'text-yellow-400' : 'text-zinc-500'}`} fill={hasUnseen ? "currentColor" : "none"} />
                                    ) : (
                                        group.user.avatar ? (
                                            <img src={group.user.avatar} alt={group.user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-400">
                                                <UserIcon className="h-6 w-6" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 max-w-[64px] truncate">
                                {isMe ? "Your Story" : group.user.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Viewers/Modals */}
            <AnimatePresence>
                {activeStoryGroup && (
                    <StoryViewer
                        user={activeStoryGroup.user}
                        slides={activeStoryGroup.slides}
                        onClose={() => {
                            setViewedStoryIds(prev => new Set(prev).add(activeStoryGroup.id));
                            setViewingStoryId(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {isAddOpen && (
                <AddStoryModal
                    onClose={() => setIsAddOpen(false)}
                    onCreated={loadStories}
                />
            )}
        </>
    );
}
