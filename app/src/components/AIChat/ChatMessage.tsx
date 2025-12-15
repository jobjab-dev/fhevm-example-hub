import { User, Bot } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export const ChatMessage = ({ role, content }: MessageProps) => {
    const isUser = role === 'user';

    return (
        <div className={clsx(
            "flex gap-4 w-full mb-6", // Increased gap and margin
            isUser ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Avatar */}
            <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1", // Aligned to top
                isUser ? "bg-zinc-700 text-white" : "bg-gradient-to-tr from-blue-500 to-purple-500 text-white"
            )}>
                {isUser ? <User size={18} /> : <Bot size={18} />}
            </div>

            {/* Content Container */}
            <div className={clsx(
                "flex-1 overflow-hidden text-sm md:text-base selection:bg-yellow-500/30",
                isUser
                    ? "bg-zinc-800 text-white rounded-2xl rounded-tr-sm px-5 py-3 ml-12 max-w-fit shadow-md" // User: Bubble style
                    : "text-zinc-100 pr-4" // Bot: Open text style (Gemini-like)
            )}>
                {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
                ) : (
                    <div className="markdown-content space-y-4">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // Typography
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white border-b border-white/10 pb-2" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-white" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-medium mb-2 mt-4 text-zinc-200" {...props} />,
                                p: ({ node, ...props }) => <p className="leading-7 mb-4 text-zinc-300" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-zinc-300" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-zinc-300" {...props} />,
                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-zinc-600 pl-4 italic my-4 text-zinc-400" {...props} />,
                                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,

                                // Code Blocks
                                code(props) {
                                    const { children, className, node, ref, ...rest } = props
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                        <div className="my-4 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                            <div className="bg-zinc-900/80 px-4 py-2 text-xs text-zinc-400 font-mono border-b border-white/5 flex justify-between items-center">
                                                <span>{match[1]}</span>
                                            </div>
                                            <SyntaxHighlighter
                                                {...rest}
                                                PreTag="div"
                                                children={String(children).replace(/\n$/, '')}
                                                language={match[1]}
                                                style={vscDarkPlus}
                                                customStyle={{ margin: 0, padding: '1rem', background: '#09090b', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    ) : (
                                        <code {...rest} className="bg-white/10 text-yellow-100 rounded px-1.5 py-0.5 text-[0.9em] font-mono border border-white/5 mx-0.5">
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};
