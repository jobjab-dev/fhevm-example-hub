import React, { useState, useMemo } from 'react';
import { Terminal, Copy, Check, Code2, Lock, Shield, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import catalogData from '../data/catalog.json';
import { Link } from 'react-router-dom';
import ScrambleText from '../components/ScrambleText';
import { useChat } from '../context/ChatContext';
import { useTypewriter } from '../components/TypewriterSuggestions';

const EXAMPLES = Object.entries(catalogData).map(([key, data]) => ({ key, ...data }));

// Define category order and icons
const CATEGORY_CONFIG: Record<string, { icon: any, label: string }> = {
  'basic': { icon: Code2, label: 'Basic Concepts' },
  'encryption': { icon: Lock, label: 'Encryption' },
  'decryption': { icon: Shield, label: 'Decryption' },
  'contracts': { icon: Cpu, label: 'Smart Contracts' },
  // Fallback for others
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExampleKey, setSelectedExampleKey] = useState<string>(EXAMPLES[0].key);
  const [copied, setCopied] = useState(false);
  const typewriterText = useTypewriter();

  // Group examples by category
  const groupedExamples = useMemo(() => {
    const filtered = EXAMPLES.filter(example => {
      const matchesSearch = example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        example.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        example.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });

    const groups: Record<string, typeof EXAMPLES> = {};

    filtered.forEach(example => {
      const cat = example.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(example);
    });

    return groups;
  }, [searchTerm]);



  const copyCommand = () => {
    navigator.clipboard.writeText(`npx create-fhevm-example ${selectedExampleKey} ./${selectedExampleKey.split('/')[1] || selectedExampleKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { openChat, sendMessage } = useChat();
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      openChat(searchTerm);
    }
  };

  return (
    <div className="pb-20 relative z-10">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-yellow-500/10 blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block border border-yellow-500/20 bg-yellow-500/5 px-4 py-1.5 rounded-full text-yellow-500 text-xs font-mono mb-8 tracking-widest uppercase backdrop-blur-sm"
          >
            Confidential Smart Contracts
          </motion.div>

          {/* Adjusted font size: text-4xl on mobile, text-7xl on desktop */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold mb-8 tracking-tight"
          >
            FHEVM <span className="text-yellow-400 text-glow">Example Hub</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The complete catalog of Fully Homomorphic Encryption examples for Solidity.
            Clone, test, and deploy in seconds.
          </motion.p>

          {/* Dynamic Command Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl ring-1 ring-white/5">
              <div className="pl-4 pr-2 text-gray-500">
                <Terminal size={20} />
              </div>
              <code className="flex-grow font-mono text-xs md:text-sm text-left text-gray-300 overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
                <span className="text-purple-400">npx</span> run create <span className="text-yellow-400">{selectedExampleKey}</span> ./my-repo
              </code>
              <button
                onClick={copyCommand}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Search Bar */}
      <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4">

          {/* Typewriter Prompt Effect */}
          <div className="max-w-xl mx-auto text-center mb-2 h-5">
            <span className="text-xs text-yellow-500/50 font-mono uppercase tracking-widest mr-2">Try asking:</span>
            <span className="text-sm text-gray-400 font-mono">{typewriterText}</span>
          </div>

          <div className="relative w-full max-w-xl mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-zinc-900/90 border border-white/10 rounded-lg overflow-hidden group-focus-within:border-yellow-500/30 transition-colors">
              <div className="pl-4 pr-3 text-yellow-500">
                <Sparkles size={18} />
              </div>
              <input
                type="text"
                placeholder="Ask AI or search examples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent py-3 text-sm focus:outline-none text-white placeholder-gray-500"
              />
              <div className="pr-2">
                <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded border border-white/10 bg-white/5">
                  <span className="text-[10px] font-mono text-gray-400">ENTER</span>
                  <span className="text-[10px] text-gray-500">to ask</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
        {Object.entries(groupedExamples).map(([category, examples]) => (
          <CategorySection key={category} category={category} examples={examples} />
        ))}

        {Object.keys(groupedExamples).length === 0 && (
          <div className="text-center py-20 text-gray-500 text-lg font-mono">
            No examples found.
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySection({ category, examples }: { category: string, examples: any[] }) {
  const [hoverKey, setHoverKey] = useState(0);

  return (
    <div>
      <div
        className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-8 border-b border-white/10 pb-4 cursor-pointer group select-none"
        onMouseEnter={() => setHoverKey(prev => prev + 1)}
      >
        <h2 className="text-3xl font-bold text-white flex items-center gap-3 group-hover:text-yellow-400 transition-colors">
          <ScrambleText
            key={hoverKey}
            text={category.charAt(0).toUpperCase() + category.slice(1)}
            scrambleSpeed={20}
          />
        </h2>
        <span className="text-sm text-gray-500 font-mono">/ {examples.length} examples</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {examples.map((example) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={example.key}
            >
              <Link
                to={`/examples/${encodeURIComponent(example.key)}`}
                className="group block h-full bg-zinc-950 border border-white/10 rounded-lg p-6 hover:border-yellow-500/50 transition-all hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                    {example.key.split('/').pop()}
                  </div>
                  <Code2 size={16} className="text-gray-600 group-hover:text-yellow-500 transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                  {example.title}
                </h3>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-2">
                  {example.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                    {category}
                  </span>
                  {example.tags.slice(0, 2).map((t) => (
                    <span key={t} className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
