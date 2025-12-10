
import { Link } from 'react-router-dom';

import { PATHS } from '../data/learning-paths';

export default function Paths() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
      <div className="mb-12 border-b border-white/10 pb-8">
        <h1 className="text-4xl font-bold mb-4 font-mono">Learning Paths</h1>
        <p className="text-gray-400 text-lg">Curated journeys to master confidential smart contracts.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {PATHS.map((path) => (
          <div key={path.id} className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-yellow-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-zinc-800/50 rounded-lg flex items-center justify-center text-yellow-500 flex-shrink-0 border border-white/5 group-hover:border-yellow-500/50 transition-colors">
                <path.icon size={24} />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold font-mono group-hover:text-yellow-400 transition-colors">{path.title}</h3>
                  <span className="text-sm font-mono text-gray-500">{path.duration}</span>
                </div>
                <p className="text-gray-400 mb-8 max-w-2xl leading-relaxed">{path.description}</p>

                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-800 -z-10" />
                  <div className="flex justify-between items-center overflow-x-auto pb-4 md:pb-0 gap-4 scrollbar-hide">
                    {path.steps.map((step, idx) => (
                      <Link
                        key={step}
                        to={`/examples/${encodeURIComponent(step)}?path=${path.id}`}
                        className="flex flex-col items-center gap-3 group/step min-w-[120px]"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold font-mono text-gray-500 group-hover/step:border-yellow-500 group-hover/step:text-yellow-500 transition-colors z-10 relative">
                          {idx + 1}
                        </div>
                        <span className="text-xs font-mono text-gray-500 group-hover/step:text-white transition-colors text-center">
                          {step}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
