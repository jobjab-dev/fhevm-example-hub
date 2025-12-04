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
    return <div className="text-center py-20 text-gray-500">Example not found.</div>;
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(`npx create-fhevm-example ${decodedKey} ./${decodedKey.split('/')[1] || decodedKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} />
        Back to Catalog
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
                "text-xs uppercase tracking-wider px-2 py-1 rounded border",
                example.level === 'beginner' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                example.level === 'advanced' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {example.level}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{example.title}</h1>
            <p className="text-gray-400 leading-relaxed text-lg">
              {example.description}
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Terminal size={16} />
              Installation
            </h3>
            <div className="bg-black rounded-lg p-3 relative group">
              <code className="font-mono text-sm text-gray-300 break-all">
                npx create-fhevm-example {decodedKey} ./my-repo
              </code>
              <button 
                onClick={copyCommand}
                className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-300 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {example.tags.map(t => (
                <span key={t} className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-xs text-gray-400">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code & Preview */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/30 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center border-b border-white/10 bg-black/20">
              <button
                onClick={() => setActiveTab('contract')}
                className={clsx(
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-r border-white/10",
                  activeTab === 'contract' ? "bg-zinc-900 text-yellow-500 border-b-2 border-b-yellow-500" : "text-gray-400 hover:bg-white/5"
                )}
              >
                <FileCode size={16} />
                Contract
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={clsx(
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-r border-white/10",
                  activeTab === 'test' ? "bg-zinc-900 text-yellow-500 border-b-2 border-b-yellow-500" : "text-gray-400 hover:bg-white/5"
                )}
              >
                <Play size={16} />
                Test
              </button>
            </div>

            <div className="relative group">
               <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(content?.[activeTab] || '');
                   }}
                   className="p-2 bg-zinc-800 text-gray-400 hover:text-white rounded-lg shadow-lg"
                 >
                   <Copy size={16} />
                 </button>
               </div>
               <SyntaxHighlighter 
                 language={activeTab === 'contract' ? 'solidity' : 'typescript'} 
                 style={vscDarkPlus}
                 customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '0.9rem' }}
                 wrapLines={true}
                 showLineNumbers={true}
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

