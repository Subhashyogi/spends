"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Mic, Video, Phone, Search, MoreVertical, Smile, X, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import AudioRecorder from "./audio-recorder";
import AudioPlayer from "./audio-player";
import { socket } from "@/lib/socket";

type Message = {
    _id: string;
    sender: {
        _id: string;
        name: string;
        image?: string;
    };
    content: string;
    type: "text" | "image" | "video" | "audio";
    fileUrl?: string;
    createdAt: string;
    read?: boolean;
    conversationId?: string;
};

type User = {
    _id: string;
    name: string;
    image?: string;
    email: string;
};

type Conversation = {
    _id: string;
    participants: User[];
};

export default function ChatWindow({ conversationId, onBack }: { conversationId: string, onBack?: () => void }) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (conversationId) {
            fetchConversation();
            fetchMessages();

            socket.emit("join_conversation", conversationId);

            socket.on("receive_message", (message: Message) => {
                if (message.conversationId === conversationId) {
                    setMessages((prev) => {
                        if (prev.some(m => m._id === message._id)) return prev;
                        return [...prev, message];
                    });
                    // If I am viewing the conversation, mark incoming message as read immediately
                    if (message.sender._id !== (session?.user as any)?.id) {
                        markMessagesAsRead();
                    }
                }
            });

            socket.on("messages_read", (data: any) => {
                if (data.conversationId === conversationId) {
                    setMessages((prev) => prev.map(msg =>
                        msg.sender._id === (session?.user as any)?.id ? { ...msg, read: true } : msg
                    ));
                }
            });

            return () => {
                socket.off("receive_message");
                socket.off("messages_read");
            };
        }
    }, [conversationId, (session?.user as any)?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversation = async () => {
        try {
            const res = await fetch("/api/chat/conversations");
            const data = await res.json();
            if (data.conversations) {
                const found = data.conversations.find((c: any) => c._id === conversationId);
                if (found) setConversation(found);
            }
        } catch (error) {
            console.error("Failed to fetch conversation", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
                // Mark messages as read when fetched
                markMessagesAsRead();
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const markMessagesAsRead = async () => {
        if (!(session?.user as any)?.id || !conversationId) return;

        try {
            await fetch("/api/chat/messages/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId }),
            });

            // Emit socket event to notify sender
            socket.emit("mark_read", {
                conversationId,
                readerId: (session?.user as any)?.id
            });
        } catch (error) {
            console.error("Failed to mark messages as read", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/chat/upload", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data.url;
    };

    const handleSend = async (audioBlob?: Blob) => {
        if (!input.trim() && !selectedFile && !audioBlob) return;

        let type = "text";
        let fileUrl = undefined;

        try {
            if (audioBlob) {
                type = "audio";
                const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });
                fileUrl = await uploadFile(file);
            } else if (selectedFile) {
                fileUrl = await uploadFile(selectedFile);
                if (selectedFile.type.startsWith("image/")) type = "image";
                else if (selectedFile.type.startsWith("video/")) type = "video";
            }

            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId,
                    content: input,
                    type,
                    fileUrl,
                }),
            });

            const data = await res.json();
            if (data.message) {
                socket.emit("send_message", data.message);
                setMessages((prev) => [...prev, data.message]);
            }

            setInput("");
            clearFile();
            setIsRecording(false);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const otherParticipant = conversation?.participants.find(p => p._id !== (session?.user as any)?.id);

    return (
        <div className="flex h-full flex-col bg-[#0b141a] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 md:px-4 md:py-2.5 bg-[#202c33] border-l border-zinc-700">
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Back button for mobile */}
                    <button onClick={onBack} className="md:hidden text-zinc-400">
                        <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                    </button>

                    <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full bg-zinc-600">
                        {otherParticipant?.image ? (
                            <Image src={otherParticipant.image} alt={otherParticipant.name} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                <UserIcon />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-100 font-medium text-sm md:text-base">{otherParticipant?.name || "User"}</span>
                        {/* <span className="text-xs text-zinc-400">online</span> */}
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-zinc-400">
                    <button className="hover:text-zinc-200"><Video className="h-4 w-4 md:h-5 md:w-5" /></button>
                    <button className="hover:text-zinc-200"><Phone className="h-4 w-4 md:h-5 md:w-5" /></button>
                    <div className="h-5 md:h-6 w-[1px] bg-zinc-600 mx-0.5 md:mx-1"></div>
                    <button className="hover:text-zinc-200"><Search className="h-4 w-4 md:h-5 md:w-5" /></button>
                    <button className="hover:text-zinc-200"><MoreVertical className="h-4 w-4 md:h-5 md:w-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 bg-[#0b141a] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-fixed opacity-95 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {messages.map((msg) => {
                    const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                    const isMe = senderId === (session?.user as any)?.id;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[85%] md:max-w-[65%] rounded-lg p-2 shadow-sm relative text-sm ${isMe ? "bg-[#005c4b] text-white rounded-tr-none" : "bg-[#202c33] text-white rounded-tl-none"
                                    }`}
                            >
                                {/* {!isMe && <p className="text-xs font-bold text-indigo-400 mb-1">{msg.sender.name}</p>} */}

                                {msg.type === "image" && msg.fileUrl && (
                                    <div className="mb-1 relative h-48 w-48 md:h-60 md:w-60">
                                        <Image src={msg.fileUrl} alt="Image" fill className="object-cover rounded-lg" />
                                    </div>
                                )}

                                {msg.type === "video" && msg.fileUrl && (
                                    <video src={msg.fileUrl} controls className="mb-1 max-w-full rounded-lg" />
                                )}

                                {msg.type === "audio" && msg.fileUrl && (
                                    <AudioPlayer
                                        src={msg.fileUrl}
                                        senderImage={
                                            isMe && session?.user?.image
                                                ? session.user.image
                                                : (typeof msg.sender === 'object' && msg.sender.image
                                                    ? msg.sender.image
                                                    : conversation?.participants.find(p => p._id === senderId)?.image)
                                        }
                                        isMe={isMe}
                                    />
                                )}

                                {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                                <div className={`text-[10px] text-zinc-400 text-right mt-1 flex justify-end items-center gap-1 ${isMe ? "text-[#8696a0]" : "text-[#8696a0]"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    {isMe && (
                                        <span className="ml-1">
                                            {msg.read ? (
                                                <CheckCheck className="h-4 w-4 text-[#53bdeb]" /> // Blue Double Tick
                                            ) : (
                                                <CheckCheck className="h-4 w-4 text-zinc-400" /> // Grey Double Tick (Assuming delivered)
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-1 md:px-4 py-1.5 md:py-2 bg-[#202c33] flex items-center gap-1 md:gap-2 min-h-[50px] md:min-h-[62px]">
                {isRecording ? (
                    <AudioRecorder onSend={handleSend} onCancel={() => setIsRecording(false)} />
                ) : (
                    <>
                        <button className="text-zinc-400 hover:text-zinc-300 p-1">
                            <Smile className="h-5 w-5 md:h-6 md:w-6" />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-zinc-300 p-1">
                            <Paperclip className="h-5 w-5 md:h-6 md:w-6" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                        />

                        <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center px-2 md:px-4 py-1.5 md:py-2">
                            {previewUrl && (
                                <div className="relative mr-2">
                                    {selectedFile?.type.startsWith("video/") ? (
                                        <video src={previewUrl} className="h-8 md:h-10 rounded" />
                                    ) : (
                                        <img src={previewUrl} alt="Preview" className="h-8 md:h-10 rounded" />
                                    )}
                                    <button
                                        onClick={clearFile}
                                        className="absolute -top-2 -right-2 bg-zinc-700 rounded-full p-0.5 text-white"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Type a message"
                                className="w-full bg-transparent text-white outline-none text-sm placeholder:text-zinc-400"
                            />
                        </div>

                        {input.trim() || selectedFile ? (
                            <button onClick={() => handleSend()} className="text-zinc-400 hover:text-zinc-300 p-1">
                                <Send className="h-5 w-5 md:h-6 md:w-6" />
                            </button>
                        ) : (
                            <button onClick={() => setIsRecording(true)} className="text-zinc-400 hover:text-zinc-300 p-1">
                                <Mic className="h-5 w-5 md:h-6 md:w-6" />
                            </button>
                        )}
                    </>
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
