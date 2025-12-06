import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Terminal, BookOpen, LayoutDashboard, Github } from 'lucide-react';
import clsx from 'clsx';

import GridBackground from '../components/GridBackground';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Catalog', path: '/', icon: BookOpen },
    { label: 'Learning Paths', path: '/paths', icon: Terminal },
    { label: 'Dev Dashboard', path: '/dev', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-yellow-500/30 relative">
      <GridBackground />
      <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center font-bold text-black group-hover:rotate-3 transition-transform">
              Z
            </div>
            <span className="font-mono font-bold text-lg tracking-tight">
              FHEVM <span className="text-yellow-500">Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-yellow-400",
                  location.pathname === item.path ? "text-yellow-500" : "text-gray-400"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/zama-ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-12 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm font-mono">
            Built for <span className="text-yellow-500">Zama FHEVM</span> • Example Hub
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

