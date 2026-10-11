import React from 'react';

interface NavbarProps {
  onReset: () => void;
  resultsCount?: number;
  onOpenAbout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, onOpenAbout }) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-white/60 border-b border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] px-6 sm:px-12 py-4 flex items-center justify-between text-xs text-zinc-600 select-none transition-all">
      {/* Left: Tiny lowercase logo in muted serif font */}
      <div
        onClick={onReset}
        className="cursor-pointer font-serif italic text-base text-zinc-900 hover:text-black transition-colors flex items-center gap-1.5"
      >
        <span>auralyze</span>
        <span className="text-zinc-400 font-sans not-italic text-[10px]">/ musicology</span>
      </div>

      {/* Center: Tiny muted lowercase links with wide spacing */}
      <nav className="flex items-center gap-12 sm:gap-16 text-xs text-zinc-600 font-mono lowercase">
        <button
          onClick={onReset}
          className="hover:text-zinc-900 transition-colors cursor-pointer"
        >
          search
        </button>
        <button
          onClick={onOpenAbout}
          className="hover:text-zinc-900 transition-colors cursor-pointer"
        >
          about
        </button>
      </nav>

      {/* Right: Tiny indicator '• connected' in low-contrast muted gray */}
      <div className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
        <span>connected</span>
      </div>
    </header>
  );
};
