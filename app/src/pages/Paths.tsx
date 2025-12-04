import React from 'react';
import { BookOpen, ArrowRight, Shield, Code, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const PATHS = [
  {
    id: 'basics',
    title: 'FHEVM Fundamentals',
    description: 'Start here to understand encryption, decryption, and basic operations.',
    icon: BookOpen,
    steps: ['fhe-counter', 'fhe-operations', 'encrypt-single-value', 'user-decrypt-single-value'],
    duration: '45 min'
  },
  {
    id: 'security',
    title: 'Security & Access Control',
    description: 'Master input proofs, binding, and how to prevent common attacks.',
    icon: Shield,
    steps: ['access-control', 'input-proofs', 'lab-wrong-signer', 'lab-replay-attack'],
    duration: '60 min'
  },
  {
    id: 'advanced',
    title: 'Advanced Applications',
    description: 'Build real-world confidential dApps like auctions and voting.',
    icon: Code,
    steps: ['handles', 'blind-auction', 'erc20-wrapper'],
    duration: '90 min'
  }
];

export default function Paths() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Learning Paths</h1>
        <p className="text-gray-400 text-lg">Curated journeys to master confidential smart contracts.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {PATHS.map((path) => (
          <div key={path.id} className="bg-zinc-900/30 border border-white/5 rounded-xl p-8 hover:border-yellow-500/20 transition-colors">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-yellow-500 flex-shrink-0">
                <path.icon size={24} />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold">{path.title}</h3>
                  <span className="text-sm font-mono text-gray-500">{path.duration}</span>
                </div>
                <p className="text-gray-400 mb-8 max-w-2xl">{path.description}</p>

                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -z-10" />
                  <div className="flex justify-between items-center overflow-x-auto pb-4 md:pb-0 gap-4">
                    {path.steps.map((step, idx) => (
                      <Link 
                        key={step} 
                        to={`/examples/${encodeURIComponent(step.includes('/') ? step : (
                            // Simple heuristic to find category for path steps if only key provided
                            // In real app, look up from catalog
                            step === 'fhe-counter' ? 'basic/fhe-counter' :
                            step === 'fhe-operations' ? 'operations/fhe-operations' :
                            step === 'encrypt-single-value' ? 'encryption/encrypt-single-value' :
                            step === 'user-decrypt-single-value' ? 'decryption/user-decrypt-single-value' :
                            step === 'access-control' ? 'concepts/access-control' :
                            step === 'input-proofs' ? 'concepts/input-proofs' :
                            step === 'lab-wrong-signer' ? 'labs/lab-wrong-signer' :
                            step === 'lab-replay-attack' ? 'labs/lab-replay-attack' :
                            step === 'handles' ? 'concepts/handles' :
                            step === 'blind-auction' ? 'applications/blind-auction' :
                            step === 'erc20-wrapper' ? 'openzeppelin/erc20-wrapper' : step
                        ))}`}
                        className="flex flex-col items-center gap-3 group min-w-[120px]"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-yellow-500 group-hover:text-yellow-500 transition-colors z-10">
                          {idx + 1}
                        </div>
                        <span className="text-xs font-mono text-gray-500 group-hover:text-white transition-colors text-center">
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

