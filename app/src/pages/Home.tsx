import React, { useState, useMemo } from 'react';
import { Search, Terminal, Copy, Check, Filter, Code2, Lock, Shield, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import catalogData from '../data/catalog.json';
import { Link } from 'react-router-dom';
import ScrambleText from '../components/ScrambleText';

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

  return (
    <div className="pb-20 relative z-10">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-yellow-500/10 blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block border border-yellow-500/20 bg-yellow-500/5 px-4 py-1.5 rounded-full text-yellow-400 text-xs font-mono mb-8 tracking-widest uppercase backdrop-blur-sm">
            Confidential Smart Contracts
          </div>

          {/* Adjusted font size: reduced from text-5xl/7xl to text-4xl/6xl */}
          <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
            FHEVM <span className="text-yellow-400">Example Hub</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The complete catalog of Fully Homomorphic Encryption examples for Solidity.
            Clone, test, and deploy in seconds.
          </p>

          {/* Dynamic Command Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl">
              <div className="pl-4 pr-2 text-gray-500">
                <Terminal size={20} />
              </div>
              <code className="flex-grow font-mono text-sm text-left text-gray-300 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <span className="text-purple-400">npx</span> run create <span className="text-yellow-400">{selectedExampleKey}</span> ./my-repo
              </code>
              <button
                onClick={copyCommand}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative w-full max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grouped Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
        {Object.entries(groupedExamples).map(([category, examples]) => (
          <CategorySection key={category} category={category} examples={examples} />
        ))}

        {Object.keys(groupedExamples).length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No examples found matching your criteria.
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
        className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4 cursor-pointer group select-none"
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
