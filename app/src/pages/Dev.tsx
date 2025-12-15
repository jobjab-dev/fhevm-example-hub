import { Terminal, CheckCircle, AlertTriangle, RefreshCw, Box, Database, Activity, ExternalLink, Github, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import catalogData from '../data/catalog.json';

const EXAMPLES = Object.entries(catalogData).map(([key, data]) => ({ key, ...data }));

export default function Dev() {
  const stats = {
    total: EXAMPLES.length,
    stable: EXAMPLES.filter(e => e.status === 'stable').length,
    experimental: EXAMPLES.filter(e => e.status === 'experimental').length,
    categories: new Set(EXAMPLES.map(e => e.category)).size
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(EXAMPLES.length / itemsPerPage);

  const currentExamples = EXAMPLES.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
      <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4 font-mono">Developer Dashboard</h1>
          <p className="text-gray-400 text-lg">System status, network health, and utility tools.</p>
        </div>

        <div className="flex gap-4">
          <a href="https://github.com/jobjab-dev/fhevm-example-hub/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all">
            <Github size={16} />
            <span className="text-sm font-mono">Report Issue</span>
          </a>
          <a href="https://github.com/jobjab-dev/fhevm-example-hub#readme" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 transition-all">
            <span className="text-sm font-mono">Documentation</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded text-blue-500"><Box size={18} /></div>
            <span className="text-xs font-mono text-gray-500 uppercase">Total Examples</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total}</div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded text-green-500"><Activity size={18} /></div>
            <span className="text-xs font-mono text-gray-500 uppercase">Stable</span>
          </div>
          <div className="text-2xl font-bold text-green-400 font-mono">{stats.stable}</div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded text-yellow-500"><AlertTriangle size={18} /></div>
            <span className="text-xs font-mono text-gray-500 uppercase">Experimental</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{stats.experimental}</div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded text-purple-500"><Database size={18} /></div>
            <span className="text-xs font-mono text-gray-500 uppercase">Categories</span>
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">{stats.categories}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-mono">
            <Terminal size={20} className="text-yellow-500" />
            Quick Scripts
          </h2>
          <div className="space-y-3">
            {[
              { cmd: 'npm run create <name>', desc: 'Scaffold a new FHEVM example project.' },
              { cmd: 'npm run create:category', desc: 'Create a new example category.' },
              { cmd: 'npm run sync:content', desc: 'Sync file system changes to catalog.json.' },
              { cmd: 'npm run validate:all', desc: 'Run all tests across every example repository.' },
              { cmd: 'npm run docs', desc: 'Regenerate documentation from source code.' },
              { cmd: 'npm run update:deps', desc: 'Update dependencies for all examples.' },
              { cmd: 'npm run clean', desc: 'Remove build artifacts (dist folder).' },
            ].map((item) => (
              <div key={item.cmd} className="flex items-start justify-between group p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all">
                <div>
                  <code className="text-sm font-mono text-yellow-500 block mb-1">{item.cmd}</code>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(item.cmd)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-md transition-all text-gray-400 hover:text-white"
                  title="Copy command"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-6 font-mono flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            Status Overview
          </h2>
          <div className="overflow-x-auto flex-grow scrollbar-hide">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="pb-3 pl-2 font-mono text-xs uppercase tracking-wider">Example</th>
                  <th className="pb-3 font-mono text-xs uppercase tracking-wider">Category</th>
                  <th className="pb-3 font-mono text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentExamples.map(ex => (
                  <tr key={ex.key} className="group hover:bg-white/5 transition-colors">
                    <td className="py-3 pl-2 font-mono text-gray-300 text-xs">{ex.key.split('/').pop()}</td>
                    <td className="py-3 text-gray-500 capitalize text-xs">{ex.category}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border font-mono ${ex.status === 'stable'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                        {ex.status === 'stable' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                        {ex.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-gray-500 font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
