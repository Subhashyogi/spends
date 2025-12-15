"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, TrendingUp, ShoppingBag, Calendar, Award, Type } from "lucide-react";
import Button from "@/components/ui/button";

const GRADIENTS = [
    { name: "Blue", class: "from-blue-500 to-indigo-600" },
    { name: "Purple", class: "from-purple-500 to-pink-600" },
    { name: "Orange", class: "from-orange-500 to-red-600" },
    { name: "Green", class: "from-emerald-500 to-teal-600" },
    { name: "Dark", class: "from-zinc-800 to-zinc-900" },
];

const FONTS = [
    { name: "Modern", class: "font-sans" },
    { name: "Classic", class: "font-serif" },
    { name: "Mono", class: "font-mono" },
    { name: "Bold", class: "font-black" },
];

interface ShareableItem {
    type: 'text' | 'health' | 'badge' | 'stat';
    title?: string;
    value?: string;
    subtext?: string;
    color: string;
    icon?: string;
}

export default function AddStoryModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
    const [content, setContent] = useState("");
    const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
    const [selectedFont, setSelectedFont] = useState(FONTS[0]);
    const [loading, setLoading] = useState(false);
    const [shareables, setShareables] = useState<ShareableItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ShareableItem | null>(null); // null means 'text' mode initially, or we can make text an item

    useEffect(() => {
        // Load shareables
        fetch("/api/user/shareables")
            .then(res => res.json())
            .then(data => {
                if (data.shareables) {
                    // Add "Text" option as the first item
                    const textItem: ShareableItem = { type: 'text', title: 'Write', color: GRADIENTS[0].class, icon: 'type' };
                    setShareables([textItem, ...data.shareables]);
                    setSelectedItem(textItem);
                }
            })
            .catch(e => console.error(e));
    }, []);

    const handleSubmit = async () => {
        if (!selectedItem) return;

        let payload: any = {};

        if (selectedItem.type === 'text') {
            if (!content.trim()) return;
            payload = {
                type: 'text',
                content,
                color: selectedGradient.class,
                font: selectedFont.class
            };
        } else {
            payload = {
                type: selectedItem.type,
                content: selectedItem.value,
                title: selectedItem.title,
                subtext: selectedItem.subtext,
                icon: selectedItem.icon,
                color: selectedItem.color
            };
        }

        setLoading(true);
        try {
            const res = await fetch("/api/stories/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                onCreated();
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Icon mapping helper
    const getIcon = (name?: string) => {
        if (name === 'heart') return <Heart className="h-8 w-8 text-white fill-white/20" />;
        if (name === 'trending-up') return <TrendingUp className="h-8 w-8 text-white" />;
        if (name === 'shopping-bag') return <ShoppingBag className="h-8 w-8 text-white" />;
        if (name === 'badge') return <Award className="h-8 w-8 text-white" />;
        if (name === 'type') return <Type className="h-6 w-6 text-white" />;
        return <Award className="h-8 w-8 text-white" />;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 rounded-full text-white hover:bg-black/30 transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    {/* Preview Area */}
                    <div className={`relative flex-1 min-h-0 w-full flex items-center justify-center p-8 text-center bg-gradient-to-br ${selectedItem?.type === 'text' ? selectedGradient.class : selectedItem?.color}`}>
                        <div className="w-full h-full aspect-[9/16] max-h-full flex items-center justify-center">
                            {selectedItem?.type === 'text' ? (
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Type something..."
                                    className={`w-full bg-transparent text-white text-3xl font-bold text-center placeholder-white/50 border-none outline-none resize-none overflow-hidden ${selectedFont.class}`}
                                    style={{ height: 'auto' }} // Let it size naturally, centered by parent flex
                                    maxLength={140}
                                    rows={3}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="mb-6 rounded-full bg-white/20 p-6 backdrop-blur-sm shadow-xl">
                                        {getIcon(selectedItem?.icon)}
                                    </div>
                                    <h2 className="mb-2 text-lg font-medium opacity-90 text-white">{selectedItem?.title}</h2>
                                    <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">{selectedItem?.value}</h1>
                                    <p className="rounded-full bg-black/20 px-4 py-1 text-sm font-medium backdrop-blur-sm text-white">
                                        {selectedItem?.subtext}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
                        {/* Option Selector (Scrollable) */}
                        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                            {shareables.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedItem(item)}
                                    className={`flex flex-col items-center gap-2 flex-shrink-0 p-3 rounded-2xl border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 ${selectedItem === item ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                                >
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br ${item.color} shadow-sm`}>
                                        {item.type === 'text' ? <Type className="w-6 h-6 text-white" /> : getIcon(item.icon)}
                                    </div>
                                    <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 w-24 truncate text-center leading-tight">
                                        {item.type === 'text' ? 'Write' : (item.value || item.title)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Styles for Text Mode */}
                        {selectedItem?.type === 'text' && (
                            <div className="space-y-3">
                                {/* Font Picker */}
                                <div className="flex justify-center gap-2">
                                    {FONTS.map(f => (
                                        <button
                                            key={f.name}
                                            onClick={() => setSelectedFont(f)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:scale-105 active:scale-95 transition-all ${selectedFont.name === f.name ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black' : 'border-zinc-300 text-zinc-600'}`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                                {/* Color Picker */}
                                <div className="flex gap-2 justify-center">
                                    {GRADIENTS.map((g) => (
                                        <button
                                            key={g.name}
                                            onClick={() => setSelectedGradient(g)}
                                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${g.class} ring-2 ring-offset-2 dark:ring-offset-zinc-900 cursor-pointer hover:scale-110 active:scale-90 transition-transform ${selectedGradient.name === g.name ? 'ring-black dark:ring-white' : 'ring-transparent'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button onClick={handleSubmit} disabled={loading || (selectedItem?.type === 'text' && !content.trim())} className="w-full">
                            {loading ? "Posting..." : "Share to Story"} <Send className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
