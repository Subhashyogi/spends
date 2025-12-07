"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";
import Image from "next/image";

export default function AudioPlayer({ src, senderImage, isMe }: { src: string, senderImage?: string, isMe?: boolean }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const setAudioDuration = () => {
            setDuration(audio.duration);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", setAudioDuration);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", setAudioDuration);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (audioRef.current) {
            const time = (value / 100) * audioRef.current.duration;
            audioRef.current.currentTime = time;
            setProgress(value);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-1.5 md:gap-3 w-full max-w-[200px] md:max-w-[280px] p-1 relative">
            <audio ref={audioRef} src={src} className="hidden" />

            {/* Avatar with Mic Badge */}
            <div className="relative z-10 flex-shrink-0">
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-full overflow-hidden bg-zinc-700">
                    {senderImage ? (
                        <Image src={senderImage} alt="Sender" fill className="object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400">
                            <UserIcon />
                        </div>
                    )}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-0.5 md:p-1 rounded-full ${isMe ? "bg-[#005c4b]" : "bg-zinc-800"}`}>
                    <Mic className={`h-2.5 w-2.5 md:h-3 md:w-3 ${isMe ? "text-[#53bdeb]" : "text-green-500"}`} />
                </div>
            </div>

            <button
                onClick={togglePlay}
                className="flex-shrink-0 h-6 w-6 md:h-8 md:w-8 flex items-center justify-center rounded-full transition-colors text-zinc-400 hover:text-zinc-300 z-10"
            >
                {isPlaying ? (
                    <Pause className="h-6 w-6 md:h-8 md:w-8 fill-current" />
                ) : (
                    <Play className="h-6 w-6 md:h-8 md:w-8 fill-current" />
                )}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-0.5 md:gap-1 relative min-w-0">
                {/* Waveform Visualization (Simulated) */}
                <div className="flex items-center gap-[1.5px] h-5 md:h-6 w-full opacity-60 overflow-hidden min-w-0">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-[1.5px] md:w-1 rounded-full flex-shrink-0 transition-all duration-300 ${(i / 18) * 100 < progress
                                ? (isMe ? "bg-[#d9fdd3]" : "bg-zinc-300")
                                : (isMe ? "bg-[#005c4b]/50" : "bg-zinc-500")
                                }`}
                            style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[11px] text-zinc-300/70 font-medium">
                    <span>{formatTime(currentTime)}</span>
                </div>
                {/* Seek Input (Scoped to waveform area) */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
            </div>
        </div>
    );
}

function UserIcon() {
    return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}
