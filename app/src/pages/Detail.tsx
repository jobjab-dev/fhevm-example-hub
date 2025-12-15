import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, Copy, Check, FileCode, Play, ChevronRight, ChevronLeft, Sparkles, Brain, ZoomIn, ZoomOut, RotateCcw, Maximize2, X, Move } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import sol from 'react-syntax-highlighter/dist/esm/languages/prism/solidity';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import catalogData from '../data/catalog.json';
import contentMap from '../data/content.json';
import clsx from 'clsx';
import { useChat } from '../context/ChatContext';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#eab308',
    primaryTextColor: '#fff',
    primaryBorderColor: '#eab308',
    lineColor: '#6b7280',
    secondaryColor: '#1f2937',
    tertiaryColor: '#111827',
  },
});

// Mermaid component for rendering diagrams with expand button
function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
      } catch (error) {
        console.error('Mermaid render error:', error);
        setSvgContent(`<pre class="text-red-400 text-xs">${chart}</pre>`);
      }
    };
    renderDiagram();
  }, [chart]);

  useEffect(() => {
    if (containerRef.current && svgContent) {
      containerRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  // Reset zoom/pan when opening fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isFullscreen]);

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  return (
    <>
      {/* Normal view - only expand button */}
      <div className="relative bg-black/20 rounded-lg border border-white/5">
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 z-10 p-1.5 bg-zinc-800/90 hover:bg-zinc-700 backdrop-blur-sm rounded-lg transition-colors text-gray-400 hover:text-white border border-white/10"
          title="Expand"
        >
          <Maximize2 size={16} />
        </button>
        <div ref={containerRef} className="overflow-x-auto py-4 px-2" />
      </div>

      {/* Fullscreen Modal - rendered via Portal to document.body */}
      {isFullscreen && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Controls Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: '#18181b',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ color: '#9ca3af', fontSize: '14px', fontFamily: 'monospace' }}>
              Diagram Viewer
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleZoomOut}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#d4d4d8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{
                color: '#9ca3af',
                fontSize: '12px',
                fontFamily: 'monospace',
                minWidth: '50px',
                textAlign: 'center',
              }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#d4d4d8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#d4d4d8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={16} />
              </button>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
              <button
                onClick={() => setIsFullscreen(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={16} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Diagram Content Area */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>

          {/* Bottom hint */}
          <div style={{
            padding: '8px 24px',
            backgroundColor: '#18181b',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            <Move size={14} />
            <span>Drag to pan • Scroll to zoom • Press ESC to close</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

SyntaxHighlighter.registerLanguage('solidity', sol);
SyntaxHighlighter.registerLanguage('typescript', ts);
// Type definitions
interface CatalogEntry {
  title: string;
  description: string;
  category: string;
  tags: string[];
  contract: string;
  test: string;
  level?: string;
  extraDoc?: string;
  keyConcepts?: string[];
}

interface ContentEntry {
  contract: string;
  test: string;
  extraDoc?: string;
  keyConcepts?: string[];
}

export default function Detail() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const { openChat } = useChat();

  const [activeTab, setActiveTab] = useState<'contract' | 'test'>('contract');
  const [copied, setCopied] = useState(false);

  // Decoded key might be needed if passed encoded
  const decodedKey = decodeURIComponent(key || '');
  const catalog = catalogData as Record<string, CatalogEntry>;
  const contentStore = contentMap as Record<string, ContentEntry>;

  const example = catalog[decodedKey];
  const content = contentStore[decodedKey];

  // Global Sequence Logic
  const allKeys = Object.keys(catalogData);
  const currentIdx = allKeys.indexOf(decodedKey);
  const nextKey = currentIdx < allKeys.length - 1 ? allKeys[currentIdx + 1] : null;
  const prevKey = currentIdx > 0 ? allKeys[currentIdx - 1] : null;

  const navigateToStep = (stepKey: string) => {
    navigate(`/examples/${encodeURIComponent(stepKey)}`);
    window.scrollTo(0, 0);
  };

  if (!example) {
    return <div className="text-center py-20 text-gray-500 font-mono">Example not found.</div>;
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(`npx jobjab-fhevm-examples ${decodedKey} ./my-project`);
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
                <span className="text-purple-400">npx</span> jobjab-fhevm-examples <span className="text-yellow-500">{decodedKey}</span> ./my-project
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

          {/* Key FHE Concepts */}
          {content?.keyConcepts && content.keyConcepts.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2 font-mono">
                <Brain size={16} className="text-purple-400" />
                KEY FHE CONCEPTS
              </h3>
              <ul className="space-y-2">
                {content.keyConcepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-yellow-500 mt-1">•</span>
                    <code className="font-mono text-xs bg-black/30 px-2 py-0.5 rounded text-purple-300">{concept}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extra Documentation with Mermaid Diagrams */}
          {content?.extraDoc && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="prose prose-invert prose-sm max-w-none documentation-content">
                <ReactMarkdown
                  components={{
                    code: ({ className, children }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      if (match && match[1] === 'mermaid') {
                        return <MermaidDiagram chart={String(children).trim()} />;
                      }
                      return (
                        <code className="bg-black/50 px-1 py-0.5 rounded text-purple-300 text-xs font-mono">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    h2: ({ children }) => (
                      <h2 className="text-base font-bold text-white mt-4 mb-2 font-mono">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-bold text-gray-300 mt-3 mb-1 font-mono">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-400 text-sm leading-relaxed mb-2">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-yellow-500 font-semibold">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 mb-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1 mb-2">{children}</ol>
                    ),
                  }}
                >
                  {content.extraDoc}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code & Preview */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 pr-2">
              <div className="flex">
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

              <button
                onClick={() => openChat(`Can you explain the logic behind the "${example.title}" (${decodedKey}) example? I specifically want to understand the key FHE operations in the code.`)}
                className="flex items-center gap-2 text-xs font-mono text-yellow-500 hover:text-white bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded transition-colors border border-yellow-500/20 mr-2"
              >
                <Sparkles size={12} />
                EXPLAIN
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

      {/* Footer Navigation (Global) */}
      <div className="mt-20 border-t border-white/10 pt-8 flex justify-between items-center">
        <button
          onClick={() => prevKey && navigateToStep(prevKey)}
          disabled={!prevKey}
          className={clsx(
            "flex items-center gap-3 px-6 py-4 rounded-lg border transition-all",
            prevKey
              ? "border-white/10 hover:border-yellow-500/50 hover:bg-zinc-900 group cursor-pointer"
              : "border-transparent text-gray-600 cursor-not-allowed"
          )}
        >
          <ChevronLeft size={20} className={prevKey ? "group-hover:-translate-x-1 transition-transform text-gray-400 group-hover:text-yellow-500" : ""} />
          <div className="text-left">
            <div className="text-xs text-gray-500 font-mono uppercase">Previous</div>
            {prevKey && (
              <div className={clsx("font-bold text-gray-300 group-hover:text-white")}>
                {catalogData[prevKey as keyof typeof catalogData]?.title || prevKey}
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => nextKey ? navigateToStep(nextKey) : navigate('/')}
          className={clsx(
            "flex items-center gap-3 px-6 py-4 rounded-lg border transition-all hover:bg-zinc-900 group cursor-pointer",
            nextKey
              ? "border-white/10 hover:border-yellow-500/50"
              : "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
          )}
        >
          <div className="text-right">
            <div className="text-xs text-gray-500 font-mono uppercase">{nextKey ? 'Next Example' : 'Back to Catalog'}</div>
            <div className={clsx("font-bold text-gray-300 group-hover:text-white", !nextKey && "text-green-400")}>
              {nextKey ? catalogData[nextKey as keyof typeof catalogData]?.title || nextKey : "All Examples Done"}
            </div>
          </div>
          {nextKey ? (
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-yellow-500" />
          ) : (
            <Check size={20} className="text-green-400" />
          )}
        </button>
      </div>
    </div>
  );
}
