import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, TrendingUp, ShoppingBag, Award, Type, Calendar } from "lucide-react";

interface StorySlide {
    id: string;
    type: 'overview' | 'top_category' | 'trend' | 'health' | 'story';
    title: string;
    value: string;
    subtext: string;
    color: string;
    icon?: string;
    font?: string;
    viewers?: { avatar: string }[];
}

interface StoryViewerProps {
    user: { name: string; username?: string; avatar?: string; }; // User info
    slides: StorySlide[];
    onClose: () => void;
}

export default function StoryViewer({ user, slides, onClose }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) setCurrentIndex(c => c + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(c => c - 1);
    };

    const currentSlide = slides[currentIndex];

    // Mark as viewed
    useEffect(() => {
        // Use storyId if available (mapped from backend _id), otherwise id
        const sId = (currentSlide as any).storyId || currentSlide.id;

        if (sId) {
            fetch('/api/stories/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyId: sId })
            }).catch(err => console.error("Failed to mark view", err));
        }
    }, [currentSlide]);

    // Auto-advance
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentIndex < slides.length - 1) {
                setCurrentIndex(c => c + 1);
            } else {
                onClose(); // Close on finish
            }
        }, 5000); // 5 seconds per slide
        return () => clearTimeout(timer);
    }, [currentIndex, slides.length, onClose]);

    // Icon mapping
    const getIcon = (name?: string) => {
        if (name === 'heart') return <Heart className="h-12 w-12 text-white fill-white/20 animate-pulse" />;
        if (name === 'trending-up') return <TrendingUp className="h-12 w-12 text-white" />;
        if (name === 'shopping-bag') return <ShoppingBag className="h-12 w-12 text-white" />;
        if (name === 'badge' || name === 'award') return <Award className="h-12 w-12 text-white" />;
        if (name === 'type') return <Type className="h-12 w-12 text-white" />;
        return <Calendar className="h-12 w-12 text-white" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
            {/* Mobile-like container */}
            <div className={`relative h-full w-full max-w-md overflow-hidden bg-gradient-to-br ${currentSlide.color} shadow-2xl sm:h-[90vh] sm:rounded-3xl`}>

                {/* Progress Bars */}
                <div className="absolute top-4 left-0 right-0 z-30 flex gap-1 px-4">
                    {slides.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                            {idx < currentIndex ? (
                                // Completed: Static full width
                                <div className="h-full w-full bg-white shadow-sm" />
                            ) : idx === currentIndex ? (
                                // Active: Animate fill
                                <motion.div
                                    className="h-full bg-white shadow-sm"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            ) : (
                                // Future: Empty
                                <div className="h-full w-0 bg-white" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Top Header (User Info) */}
                <div className="absolute top-8 left-4 z-30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/30">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight drop-shadow-md">
                            @{user.username || user.name.replace(/\s+/g, '').toLowerCase()}
                        </span>
                        <span className="text-xs font-medium text-white/80 drop-shadow-md">{currentSlide.subtext}</span>
                    </div>
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-8 right-4 z-30 text-white opacity-80 hover:opacity-100 p-2">
                    <X className="h-6 w-6 shadow-sm" />
                </button>

                {/* Main Content Layer */}
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center pointer-events-none z-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center h-full w-full"
                        >
                            {currentSlide.icon && (
                                <div className="mb-6 rounded-full bg-white/10 p-4 shadow-xl backdrop-blur-sm border border-white/20">
                                    {getIcon(currentSlide.icon)}
                                </div>
                            )}

                            {currentSlide.type !== 'story' && (
                                <h2 className="mb-2 text-xl font-medium opacity-90">{currentSlide.title}</h2>
                            )}

                            {/* Content Value/Text */}
                            <h1 className={`${currentSlide.value.length > 50 ? 'text-2xl' : 'text-4xl'} mb-4 font-bold tracking-tight break-words w-full ${currentSlide.font || 'font-sans'}`}>
                                {currentSlide.value}
                            </h1>

                            {/* Subtext Pill */}
                            {currentSlide.type !== 'story' && (
                                <div className="mt-4 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
                                    {currentSlide.subtext}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Viewers Footer (Bottom Left) */}
                {currentSlide.viewers && currentSlide.viewers.length > 0 && (
                    <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 pointer-events-none">
                        <div className="flex -space-x-3">
                            {currentSlide.viewers.slice(0, 3).map((v, i) => (
                                <div key={i} className="h-8 w-8 rounded-full border-2 border-white/20 bg-zinc-800 overflow-hidden shadow-sm">
                                    {v.avatar ? (
                                        <img src={v.avatar} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-zinc-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-white drop-shadow-md ml-1">
                            {currentSlide.viewers.length} views
                        </span>
                    </div>
                )}

                {/* Tap Zones */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="flex-1" onClick={handlePrev} />
                    <div className="flex-[2]" onClick={handleNext} />
                </div>

            </div>
        </motion.div>
    );
}
