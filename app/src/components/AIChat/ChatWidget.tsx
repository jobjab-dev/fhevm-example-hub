import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageSquare, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { ChatMessage } from './ChatMessage';
import clsx from 'clsx';

export const ChatWidget = () => {
    const { isOpen, toggleChat, messages, sendMessage, isTyping, clearChat } = useChat();
    const [input, setInput] = React.useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen, isExpanded]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const msg = input;
        setInput('');
        await sendMessage(msg);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleChat}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-shadow"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={clsx(
                            "fixed bottom-24 right-6 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden ring-1 ring-white/5 transition-all duration-300 ease-in-out",
                            isExpanded
                                ? "w-[800px] h-[80vh] max-w-[calc(100vw-3rem)]"
                                : "w-96 h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)]"
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <h3 className="font-bold text-white">FHEVM Assistant</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="text-gray-400 hover:text-red-400 transition-colors p-1 hover:bg-white/10 rounded"
                                    title="Clear Chat History"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                                >
                                    {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                            ))}
                            {isTyping && (
                                <div className="flex gap-2 text-gray-500 text-sm ml-12 animate-pulse">
                                    AI is thinking...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-zinc-900/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about FHE examples..."
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-colors placeholder:text-gray-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
