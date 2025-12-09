import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Terminal, BookOpen, LayoutDashboard, Github, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import GridBackground from '../components/GridBackground';
import { ChatWidget } from '../components/AIChat/ChatWidget';

const Layout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Catalog', path: '/', icon: BookOpen },
    { label: 'Learning Paths', path: '/paths', icon: Terminal },
    { label: 'Dev Dashboard', path: '/dev', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-yellow-500/30 relative overflow-x-hidden">
      <GridBackground />
      <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group z-50 relative" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center font-bold text-black group-hover:rotate-3 transition-transform">
              Z
            </div>
            <span className="font-mono font-bold text-lg tracking-tight">
              FHEVM <span className="text-yellow-500">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
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

          <div className="hidden md:flex items-center gap-4">
            <a
              href="https://github.com/zama-ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white z-50 relative"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-3/4 max-w-sm bg-zinc-900 border-l border-white/10 z-40 md:hidden pt-24 px-6 shadow-2xl"
            >
              <nav className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-4 text-lg font-medium transition-colors p-2 rounded-lg",
                      location.pathname === item.path ? "text-yellow-500 bg-white/5" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <a
                  href="https://github.com/zama-ai/fhevm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-lg font-medium text-gray-400 hover:text-white p-2"
                >
                  <Github size={20} />
                  GitHub
                </a>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-grow relative z-0">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm font-mono">
            Built for <span className="text-yellow-500">Zama FHEVM</span> • Example Hub
          </p>
        </div>
      </footer>
      <ChatWidget />
    </div >
  );
};

export default Layout;

