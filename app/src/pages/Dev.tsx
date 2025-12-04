import React from 'react';
import { Terminal, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import catalogData from '../data/catalog.json';

const EXAMPLES = Object.entries(catalogData).map(([key, data]) => ({ key, ...data }));

export default function Dev() {
  const stats = {
    total: EXAMPLES.length,
    stable: EXAMPLES.filter(e => e.status === 'stable').length,
    experimental: EXAMPLES.filter(e => e.status === 'experimental').length,
    categories: new Set(EXAMPLES.map(e => e.category)).size
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-4">Developer Dashboard</h1>
          <p className="text-gray-400 text-lg">Maintenance status and utility tools.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center min-w-[100px]">
             <div className="text-2xl font-bold text-white">{stats.total}</div>
             <div className="text-xs text-gray-500 uppercase tracking-wider">Examples</div>
           </div>
           <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center min-w-[100px]">
             <div className="text-2xl font-bold text-green-500">{stats.stable}</div>
             <div className="text-xs text-gray-500 uppercase tracking-wider">Stable</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Terminal size={20} className="text-yellow-500" />
            Maintenance Scripts
          </h2>
          <div className="space-y-4">
            {[
              { cmd: 'npm run validate:all', desc: 'Run all tests across every example repository.' },
              { cmd: 'npm run docs', desc: 'Regenerate documentation from source code.' },
              { cmd: 'npm run update:deps', desc: 'Update dependencies for all examples.' },
            ].map((item) => (
              <div key={item.cmd} className="flex items-start justify-between group p-3 hover:bg-white/5 rounded-lg transition-colors">
                <div>
                  <code className="text-sm font-mono text-yellow-500 block mb-1">{item.cmd}</code>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(item.cmd)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Status Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="pb-3 pl-2">Example</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {EXAMPLES.map(ex => (
                  <tr key={ex.key} className="group hover:bg-white/5 transition-colors">
                    <td className="py-3 pl-2 font-mono text-gray-300">{ex.key}</td>
                    <td className="py-3 text-gray-500 capitalize">{ex.category}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${
                        ex.status === 'stable' 
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
        </div>
      </div>
    </div>
  );
}

