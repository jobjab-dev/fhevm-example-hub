import { useState, useEffect } from 'react';

const SUGGESTIONS = [
    "What is Fully Homomorphic Encryption?",
    "Explain the Blind Auction example",
    "How do Handles work in FHEVM?",
    "Show me an example of input proofs",
    "How to decrypt a single value?",
    "What is the difference between local and devnet?",
    "Explain re-encryption and why it is needed"
];

export default function TypewriterSuggestions() {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    // Blinking cursor effect
    useEffect(() => {
        const timeout2 = setInterval(() => {
            setBlink((prev) => !prev);
        }, 500);
        return () => clearInterval(timeout2);
    }, []);

    // Typing logic
    useEffect(() => {
        if (subIndex === SUGGESTIONS[index].length + 1 && !reverse) {
            setReverse(true);
            return;
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % SUGGESTIONS.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, Math.max(reverse ? 50 : subIndex === SUGGESTIONS[index].length ? 2000 : 100, Math.random() * 50)); // Fast delete, Pause at end, Natural typing speed

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse]);

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl pointer-events-none">
            {/* Positioned behind input, but visually inside due to transparency */}
            <div className={`text-md text-gray-400/30 font-mono transition-opacity duration-200 pl-16 ${
                // This component is actually tricky to position directly inside the input without z-index hacks
                // A better approach is to render it simply above the input section or as a placeholder-like element
                ""
                }`}>
                {/* We will just return the text string for the parent to render */}
            </div>
            {/* Re-thinking: The user wants it "above" the chat input (like a label) OR inside as placeholder */}
            {/* Request says: "above the AI chat slot... type and delete like prompt suggestions" */}
            <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-xs text-yellow-500/50 font-mono uppercase tracking-widest">Try asking:</span>
                <span className="text-sm text-gray-400 font-mono min-h-[20px]">
                    {`${SUGGESTIONS[index].substring(0, subIndex)}${blink ? "|" : " "}`}
                </span>
            </div>
        </div>
    );
}

// Simplified version for direct embedding
export function useTypewriter() {
    const [text, setText] = useState("");
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const timeout2 = setInterval(() => setBlink((prev) => !prev), 500);
        return () => clearInterval(timeout2);
    }, []);

    useEffect(() => {
        if (subIndex === SUGGESTIONS[index].length + 1 && !reverse) {
            const timeout = setTimeout(() => setReverse(true), 2000); // Wait bit before deleting
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % SUGGESTIONS.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? 30 : 60);

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse]);

    return `${SUGGESTIONS[index].substring(0, subIndex)}${blink ? "|" : ""}`;
}
