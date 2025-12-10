"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart, TrendingUp, ShoppingBag, Calendar } from "lucide-react";

interface StorySlide {
    id: string;
    type: 'overview' | 'top_category' | 'trend' | 'health';
    title: string;
    value: string;
    subtext: string;
    color: string;
    icon?: string;
}

interface StoryViewerProps {
    slides: StorySlide[];
    onClose: () => void;
}

export default function StoryViewer({ slides, onClose }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

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

    const handleNext = () => {
        if (currentIndex < slides.length - 1) setCurrentIndex(c => c + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(c => c - 1);
    };

    const currentSlide = slides[currentIndex];

    // Icon mapping
    const getIcon = (name?: string) => {
        if (name === 'heart') return <Heart className="h-12 w-12 text-white fill-white/20 animate-pulse" />;
        if (name === 'trending-up') return <TrendingUp className="h-12 w-12 text-white" />;
        if (name === 'shopping-bag') return <ShoppingBag className="h-12 w-12 text-white" />;
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
                <div className="absolute top-4 left-0 right-0 z-20 flex gap-1 px-4">
                    {slides.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                            <motion.div
                                className="h-full bg-white shadow-sm"
                                initial={{ width: idx < currentIndex ? "100%" : "0%" }}
                                animate={{ width: idx === currentIndex ? "100%" : idx < currentIndex ? "100%" : "0%" }}
                                transition={{ duration: idx === currentIndex ? 5 : 0, ease: "linear" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-8 right-4 z-20 text-white opacity-80 hover:opacity-100">
                    <X className="h-6 w-6" />
                </button>

                {/* Content Layer */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-full flex-col items-center justify-center p-8 text-center text-white"
                    >
                        <div className="mb-8 rounded-full bg-white/20 p-6 backdrop-blur-sm shadow-xl">
                            {getIcon(currentSlide.icon)}
                        </div>

                        <h2 className="mb-2 text-xl font-medium opacity-90">{currentSlide.title}</h2>
                        <h1 className="mb-4 text-4xl font-bold tracking-tight">{currentSlide.value}</h1>
                        <p className="rounded-full bg-black/20 px-4 py-1 text-sm font-medium backdrop-blur-sm">
                            {currentSlide.subtext}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Tap Zones */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="flex-1" onClick={handlePrev} />
                    <div className="flex-[2]" onClick={handleNext} />
                </div>
            </div>
        </motion.div>
    );
}
