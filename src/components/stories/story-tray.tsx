"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StoryViewer from "./story-viewer";
import { Zap } from "lucide-react";

export default function StoryTray() {
    const [slides, setSlides] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnseen, setHasUnseen] = useState(true);

    useEffect(() => {
        fetch("/api/stories")
            .then(res => res.json())
            .then(data => {
                if (data.slides && data.slides.length > 0) {
                    setSlides(data.slides);
                }
            })
            .catch(err => console.error("Failed to load stories", err));
    }, []);

    if (slides.length === 0) return null;

    const handleOpen = () => {
        setIsOpen(true);
        setHasUnseen(false); // Mark as seen
    };

    return (
        <>
            <div className="mb-6 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {/* Your Briefing Story */}
                <button
                    onClick={handleOpen}
                    className="group relative flex flex-col items-center gap-2"
                >
                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 ${hasUnseen ? 'border-transparent bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-[2px]' : 'border-zinc-200 dark:border-zinc-700'}`}>
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900 border-2 border-white dark:border-black shadow-lg">
                            <Zap className={`h-6 w-6 ${hasUnseen ? 'text-yellow-400' : 'text-zinc-500'}`} fill={hasUnseen ? "currentColor" : "none"} />
                        </div>
                        {hasUnseen && (
                            <span className="absolute bottom-0 right-0 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white dark:border-black"></span>
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                        Your Briefing
                    </span>
                </button>
            </div>

            {/* Fullscreen Viewer */}
            {isOpen && (
                <StoryViewer slides={slides} onClose={() => setIsOpen(false)} />
            )}
        </>
    );
}
