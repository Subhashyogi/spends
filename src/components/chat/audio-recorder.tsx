"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Trash2, Send, Pause, Play } from "lucide-react";

export default function AudioRecorder({
    onSend,
    onCancel,
}: {
    onSend: (blob: Blob) => void;
    onCancel: () => void;
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); // For reviewing
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // Generate static waveform for paused state
    // Generate static waveform for paused state
    // Generate static waveform for paused state
    // Store waveform samples for the paused state
    const waveformSamplesRef = useRef<number[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // For playback
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecordingCleanup();
        };
    }, []);

    useEffect(() => {
        if (isRecording && !isPaused) {
            drawWaveform();
        } else if (isPaused) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
    }, [isRecording, isPaused]);

    // Robust timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording, isPaused]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context for visualization
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
            waveformSamplesRef.current = [];
        } catch (error) {
            console.error("Error accessing microphone:", error);
            onCancel();
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.requestData(); // Flush current data
            mediaRecorderRef.current.pause();
        }
        setIsPaused(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Create blob for immediate playback
        // We need a small timeout to ensure ondataavailable fires after requestData
        setTimeout(() => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            setAudioBlob(blob);
        }, 100);
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            // Don't clear chunks, just continue appending
            // But clear the "finished" blob so we don't use it if we send now
            setAudioBlob(null);

            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        }
    };

    const stopRecordingCleanup = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };

    const handleSend = () => {
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                onSend(blob);
            };
            stopRecordingCleanup();
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current && audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setIsPlaying(false);
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d");
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (!canvasCtx) return;

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            // We want to draw about 15-20 bars to fit nicely
            const barCount = 15;
            const step = Math.floor(bufferLength / barCount);
            const barWidth = 2;
            const gap = 2;
            let x = 0;

            for (let i = 0; i < barCount; i++) {
                // Get average value for this chunk
                let value = 0;
                for (let j = 0; j < step; j++) {
                    value += dataArray[i * step + j];
                }
                value = value / step;

                // Scale height
                const percent = value / 255;
                let barHeight = percent * canvas.height * 1.2;

                barHeight = Math.max(2, barHeight);
                barHeight = Math.min(canvas.height, barHeight);

                canvasCtx.fillStyle = isPaused ? "#71717a" : "#d4d4d8"; // zinc-500 : zinc-300

                const y = (canvas.height - barHeight) / 2;

                roundRect(canvasCtx, x, y, barWidth, barHeight, 1);

                x += barWidth + gap;
            }
            // Capture sample for static waveform
            let total = 0;
            for (let i = 0; i < bufferLength; i++) total += dataArray[i];
            const average = total / bufferLength;
            waveformSamplesRef.current.push(average);
        };

        draw();
    };

    // Process waveform samples for display
    const getProcessedWaveform = () => {
        const samples = waveformSamplesRef.current;
        if (samples.length === 0) return Array.from({ length: 15 }).map(() => 20); // Fallback

        const barCount = 15;
        const blockSize = Math.floor(samples.length / barCount);
        const result = [];

        for (let i = 0; i < barCount; i++) {
            let sum = 0;
            const start = i * blockSize;
            const end = start + blockSize;
            // Handle case where samples < barCount
            if (blockSize < 1) {
                sum = samples[i] || 0;
            } else {
                for (let j = start; j < end && j < samples.length; j++) {
                    sum += samples[j];
                }
                sum = sum / (end - start);
            }

            // Normalize to 0-100 height
            // Assuming max volume average is around 128-200?
            const height = Math.min(100, Math.max(20, (sum / 255) * 300));
            result.push(height);
        }
        return result;
    };

    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-1 w-full">
            {/* Main Recorder Pill */}
            <div className="flex-1 flex items-center gap-1 bg-[#202c33] rounded-full px-1 py-1.5 shadow-lg min-w-0">
                {/* Delete Button */}
                <button
                    onClick={onCancel}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition flex-shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </button>

                {!isPaused ? (
                    // Recording State
                    <>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                            <span className="text-zinc-200 font-mono text-[10px] min-w-[28px]">{formatTime(duration)}</span>
                            <canvas ref={canvasRef} width={80} height={24} className="flex-1 h-6 w-full min-w-[20px]" />
                        </div>
                        <button onClick={pauseRecording} className="p-1.5 text-zinc-300 hover:text-white flex-shrink-0">
                            <Pause className="h-5 w-5" />
                        </button>
                    </>
                ) : (
                    // Paused / Review State
                    <>
                        <button onClick={togglePlayback} className="p-1.5 text-zinc-300 hover:text-white flex-shrink-0">
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>

                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                            {/* Static Waveform */}
                            <div className="flex-1 h-6 flex items-center gap-[1.5px] opacity-50 overflow-hidden min-w-0">
                                {getProcessedWaveform().map((height, i) => (
                                    <div
                                        key={i}
                                        className="w-[1.5px] bg-zinc-400 rounded-full flex-shrink-0"
                                        style={{ height: `${height}%` }}
                                    />
                                ))}
                            </div>
                            <span className="text-zinc-400 text-[10px] font-mono">{formatTime(duration)}</span>
                        </div>

                        <button onClick={resumeRecording} className="p-1.5 text-red-500 hover:text-red-400 flex-shrink-0">
                            <Mic className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] transition shadow-lg flex-shrink-0"
            >
                <Send className="h-5 w-5 ml-0.5" />
            </button>
        </div>
    );
}
