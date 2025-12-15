import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
    clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('fhevm-chat-history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        return [{
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your FHEVM assistant. Ask me anything about Zama, confidential smart contracts, or the examples in this hub.',
            timestamp: Date.now()
        }];
    });

    // Persist messages
    useEffect(() => {
        localStorage.setItem('fhevm-chat-history', JSON.stringify(messages));
    }, [messages]);

    const [isTyping, setIsTyping] = useState(false);

    const toggleChat = () => setIsOpen(prev => !prev);

    const openChat = async (initialMessage?: string) => {
        setIsOpen(true);
        if (initialMessage) {
            await sendMessage(initialMessage);
        }
    };

    const clearChat = () => {
        const welcomeMsg: Message = {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your FHEVM assistant. Ask me anything about Zama, confidential smart contracts, or the examples in this hub.',
            timestamp: Date.now()
        };
        setMessages([welcomeMsg]);
        localStorage.removeItem('fhevm-chat-history');
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
            // Prepare history for AI (convert 'assistant' to 'model')
            // Exclude the very last message we just added effectively, or just map all including the new one
            // We need to send [ ...prevMessages, userMsg ] but mapped
            const history = [...messages, userMsg].map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
                content: m.content
            }));

            const response = await sendMessageToAI(history);

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
        <ChatContext.Provider value={{ isOpen, toggleChat, messages, sendMessage, isTyping, openChat, clearChat }}>
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
