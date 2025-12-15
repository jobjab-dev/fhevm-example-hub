import { useEffect, useState, useRef } from 'react';

interface ScrambleTextProps {
    text: string;
    className?: string;
    scrambleSpeed?: number;
    revealSpeed?: number;
    trigger?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

export default function ScrambleText({
    text,
    className = '',
    scrambleSpeed = 30,
    revealSpeed: _revealSpeed = 50,
    trigger = true
}: ScrambleTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const [_isScrambling, setIsScrambling] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!trigger) return;

        let iteration = 0;
        setIsScrambling(true);

        clearInterval(intervalRef.current as NodeJS.Timeout);

        intervalRef.current = setInterval(() => {
            setDisplayText(_prev =>
                text
                    .split('')
                    .map((_char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join('')
            );

            if (iteration >= text.length) {
                clearInterval(intervalRef.current as NodeJS.Timeout);
                setIsScrambling(false);
            }

            iteration += 1 / 3; // Slower reveal
        }, scrambleSpeed);

        return () => clearInterval(intervalRef.current as NodeJS.Timeout);
    }, [text, trigger, scrambleSpeed]);

    return (
        <span className={className}>
            {displayText}
        </span>
    );
}
