"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { safeJson } from "@/lib/http";

type Txn = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    date: string;
    category?: string;
    description?: string;
};

type Message = {
    id: string;
    role: "user" | "bot";
    text: string;
    chart?: {
        type: "line" | "bar";
        data: any[];
        title: string;
    };
    timestamp: Date;
};

export default function FinanceChatbot({ embedded = false, className = "" }: { embedded?: boolean; className?: string }) {
    const [isOpen, setIsOpen] = useState(embedded);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "bot",
            text: "Hi! I'm your AI Finance Assistant. Ask me about your spending, trends, or specific categories.",
            timestamp: new Date(),
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [transactions, setTransactions] = useState<Txn[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (embedded) setIsOpen(true);
    }, [embedded]);

    useEffect(() => {
        if (isOpen && transactions.length === 0) {
            (async () => {
                try {
                    const res = await fetch("/api/transactions?limit=2000");
                    const json = await safeJson(res);
                    if (json.ok) setTransactions(json.data.data || json.data);
                } catch (e) {
                    console.error(e);
                }
            })();
        }
    }, [isOpen, transactions.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const processQuery = async (query: string) => {
        setIsTyping(true);

        try {
            // Prepare history for context
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                text: m.text
            }));

            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query, history })
            });

            const data = await safeJson(res);

            if (data.ok) {
                const { text, chart } = data.data;

                const newMessage: Message = {
                    id: Date.now().toString(),
                    role: "bot",
                    text: text,
                    chart: chart ? { type: chart.type, data: chart.data, title: chart.title } : undefined,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, newMessage]);
            } else {
                const errorText = data.data?.error || "Sorry, I encountered an error. Please try again later.";
                const errorMsg: Message = {
                    id: Date.now().toString(),
                    role: "bot",
                    text: errorText.includes("429") ? "I'm receiving too many requests right now. Please wait a minute and try again." : errorText,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMsg]);
            }
        } catch (e) {
            console.error(e);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: "bot",
                text: "Sorry, something went wrong. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        const query = input;
        setInput("");
        processQuery(query);
    };

    if (embedded) {
        return (
            <div className={`glass flex h-full w-full flex-col overflow-hidden ${className || 'rounded-3xl'}`}>
                {/* Header (Simplified for embedded) */}
                <div className="flex items-center justify-between border-b border-zinc-200/50 bg-white/30 p-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/30">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Finance AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-medium text-zinc-500">Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-700"
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                                {msg.chart && (
                                    <div className="mt-4 h-40 w-full rounded-xl bg-white/50 p-2 dark:bg-zinc-900/50">
                                        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider opacity-70">{msg.chart.title}</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            {msg.chart.type === "line" ? (
                                                <AreaChart data={msg.chart.data}>
                                                    <defs>
                                                        <linearGradient id={`grad-${msg.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="value" stroke="#6366f1" fill={`url(#grad-${msg.id})`} strokeWidth={2} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                                        formatter={(val: number) => `₹${val}`}
                                                    />
                                                </AreaChart>
                                            ) : (
                                                <BarChart data={msg.chart.data}>
                                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                    <Tooltip
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                                        formatter={(val: number) => `₹${val}`}
                                                    />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                <div className={`mt-1 text-[10px] ${msg.role === "user" ? "text-indigo-200" : "text-zinc-400"}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="border-t border-zinc-200/50 bg-transparent p-4 dark:border-zinc-800/50">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your spending..."
                            className="glass w-full rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 rounded-full bg-indigo-600 p-2 text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="glass-heavy fixed bottom-24 right-6 z-50 flex h-[500px] max-h-[calc(100vh-8rem)] w-[350px] flex-col overflow-hidden rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200/50 bg-white/30 p-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/30">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Finance AI</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] font-medium text-zinc-500">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="cursor-pointer rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === "user"
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-700"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                                        {msg.chart && (
                                            <div className="mt-4 h-40 w-full rounded-xl bg-white/50 p-2 dark:bg-zinc-900/50">
                                                <div className="mb-2 text-[10px] font-medium uppercase tracking-wider opacity-70">{msg.chart.title}</div>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {msg.chart.type === "line" ? (
                                                        <AreaChart data={msg.chart.data}>
                                                            <defs>
                                                                <linearGradient id={`grad-${msg.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Area type="monotone" dataKey="value" stroke="#6366f1" fill={`url(#grad-${msg.id})`} strokeWidth={2} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                                                formatter={(val: number) => `₹${val}`}
                                                            />
                                                        </AreaChart>
                                                    ) : (
                                                        <BarChart data={msg.chart.data}>
                                                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                            <Tooltip
                                                                cursor={{ fill: 'transparent' }}
                                                                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                                                formatter={(val: number) => `₹${val}`}
                                                            />
                                                        </BarChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        <div className={`mt-1 text-[10px] ${msg.role === "user" ? "text-indigo-200" : "text-zinc-400"}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="border-t border-zinc-200/50 bg-transparent p-4 dark:border-zinc-800/50">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your spending..."
                                    className="glass w-full rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 dark:placeholder-zinc-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 rounded-full bg-indigo-600 p-2 text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence >

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </motion.button>
        </>
    );
}
