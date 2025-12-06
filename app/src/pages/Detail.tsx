import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Terminal, Copy, Check, FileCode, Play } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import sol from 'react-syntax-highlighter/dist/esm/languages/prism/solidity';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import catalogData from '../data/catalog.json';
import contentMap from '../data/content.json';
import clsx from 'clsx';

SyntaxHighlighter.registerLanguage('solidity', sol);
SyntaxHighlighter.registerLanguage('typescript', ts);

export default function Detail() {
  const { key } = useParams<{ key: string }>();
  const [activeTab, setActiveTab] = useState<'contract' | 'test'>('contract');
  const [copied, setCopied] = useState(false);

  // Decoded key might be needed if passed encoded
  const decodedKey = decodeURIComponent(key || '');
  const example = catalogData[decodedKey as keyof typeof catalogData];
  const content = contentMap[decodedKey as keyof typeof contentMap];

  if (!example) {
    return <div className="text-center py-20 text-gray-500 font-mono">Example not found.</div>;
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(`npx create-fhevm-example ${decodedKey} ./${decodedKey.split('/')[1] || decodedKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 relative z-10">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors font-mono text-sm group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        BACK_TO_CATALOG
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono text-gray-500 bg-zinc-900 px-2 py-1 rounded border border-white/10">
                {decodedKey}
              </span>
              <span className={clsx(
                "text-[10px] uppercase tracking-wider px-2 py-1 rounded border font-mono",
                example.level === 'beginner' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                example.level === 'advanced' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {example.level}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4 font-mono">{example.title}</h1>
            <p className="text-gray-400 leading-relaxed text-lg">
              {example.description}
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2 font-mono">
              <Terminal size={16} className="text-yellow-500" />
              INSTALLATION
            </h3>
            <div className="bg-black/50 border border-white/5 rounded-lg p-3 relative group">
              <code className="font-mono text-sm text-gray-300 break-all block pr-8">
                <span className="text-purple-400">npx</span> create-fhevm-example <span className="text-yellow-500">{decodedKey}</span> ./my-repo
              </code>
              <button 
                onClick={copyCommand}
                className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-3 font-mono">TAGS</h3>
            <div className="flex flex-wrap gap-2">
              {example.tags.map(t => (
                <span key={t} className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code & Preview */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center border-b border-white/10 bg-black/40">
              <button
                onClick={() => setActiveTab('contract')}
                className={clsx(
                  "flex items-center gap-2 px-6 py-3 text-xs font-mono font-medium transition-colors border-r border-white/10 uppercase tracking-wider",
                  activeTab === 'contract' ? "bg-zinc-900 text-yellow-500 border-b-2 border-b-yellow-500" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                )}
              >
                <FileCode size={14} />
                Contract.sol
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={clsx(
                  "flex items-center gap-2 px-6 py-3 text-xs font-mono font-medium transition-colors border-r border-white/10 uppercase tracking-wider",
                  activeTab === 'test' ? "bg-zinc-900 text-yellow-500 border-b-2 border-b-yellow-500" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                )}
              >
                <Play size={14} />
                Test.ts
              </button>
            </div>

            <div className="relative group bg-[#1e1e1e]"> 
               {/* Fixed background color for code block to prevent transparency issues */}
               <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(content?.[activeTab] || '');
                   }}
                   className="p-2 bg-zinc-800 text-gray-400 hover:text-white rounded-lg shadow-lg border border-white/10"
                 >
                   <Copy size={16} />
                 </button>
               </div>
               <SyntaxHighlighter 
                 language={activeTab === 'contract' ? 'solidity' : 'typescript'} 
                 style={vscDarkPlus}
                 customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace' }}
                 wrapLines={true}
                 showLineNumbers={true}
                 lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#555', textAlign: 'right' }}
               >
                 {content?.[activeTab] || '// Loading...'}
               </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
