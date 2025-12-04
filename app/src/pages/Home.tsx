import React, { useState, useMemo } from 'react';
import { Search, Terminal, Copy, Check, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import catalogData from '../data/catalog.json';
import { Link } from 'react-router-dom';

const EXAMPLES = Object.entries(catalogData).map(([key, data]) => ({ key, ...data }));

const CATEGORIES = Array.from(new Set(EXAMPLES.map(e => e.category)));

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [selectedExampleKey, setSelectedExampleKey] = useState<string>(EXAMPLES[0].key);
  const [copied, setCopied] = useState(false);

  const filteredExamples = useMemo(() => {
    return EXAMPLES.filter(example => {
      const matchesSearch = example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          example.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          example.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || example.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const copyCommand = () => {
    navigator.clipboard.writeText(`npx create-fhevm-example ${selectedExampleKey} ./${selectedExampleKey.split('/')[1] || selectedExampleKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-yellow-500/10 blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block border border-yellow-500/20 bg-yellow-500/5 px-4 py-1.5 rounded-full text-yellow-400 text-xs font-mono mb-8 tracking-widest uppercase backdrop-blur-sm">
            Confidential Smart Contracts
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
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

      {/* Search & Filter */}
      <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Search examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            <Filter size={16} className="text-gray-500 mr-2 flex-shrink-0" />
            <button
              onClick={() => setActiveCategory('all')}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                activeCategory === 'all' 
                  ? "bg-yellow-500 text-black border-yellow-500" 
                  : "bg-transparent text-gray-400 border-white/10 hover:border-white/20"
              )}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize whitespace-nowrap",
                  activeCategory === cat
                    ? "bg-yellow-500 text-black border-yellow-500" 
                    : "bg-transparent text-gray-400 border-white/10 hover:border-white/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredExamples.map((example) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={example.key}
              >
                <Link 
                  to={`/examples/${encodeURIComponent(example.key)}`}
                  onMouseEnter={() => setSelectedExampleKey(example.key)}
                  className="group block h-full bg-zinc-900/40 border border-white/5 rounded-xl p-6 hover:border-yellow-500/30 hover:bg-zinc-900/60 transition-all hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <Terminal size={14} />
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                         <span className={clsx(
                           "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border",
                           example.level === 'beginner' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                           example.level === 'advanced' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                           "bg-blue-500/10 text-blue-400 border-blue-500/20"
                         )}>
                           {example.level || 'Intermediate'}
                         </span>
                         {example.status === 'experimental' && (
                           <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                             Experimental
                           </span>
                         )}
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                        {example.title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                      {example.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                      {example.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] uppercase tracking-wider text-gray-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredExamples.length === 0 && (
           <div className="text-center py-20 text-gray-500">
             No examples found matching your criteria.
           </div>
        )}
      </div>
    </div>
  );
}

