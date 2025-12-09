import React, { createContext, useContext, useState, ReactNode } from 'react';
import { sendMessageToAI } from '../services/ai';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatContextType {
    isOpen: boolean;
    toggleChat: () => void;
    messages: Message[];
    sendMessage: (content: string) => Promise<void>;
    isTyping: boolean;
    openChat: (initialMessage?: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your FHEVM assistant. Ask me anything about Zama, confidential smart contracts, or the examples in this hub.',
            timestamp: Date.now()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const toggleChat = () => setIsOpen(prev => !prev);

    const openChat = async (initialMessage?: string) => {
        setIsOpen(true);
        if (initialMessage) {
            await sendMessage(initialMessage);
        }
    };

    const sendMessage = async (content: string) => {
        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const response = await sendMessageToAI(content);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response || "Sorry, I couldn't generate a response.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again later.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <ChatContext.Provider value={{ isOpen, toggleChat, messages, sendMessage, isTyping, openChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
