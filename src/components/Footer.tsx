'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-4 font-mono text-xs mt-10">
      <div className="max-w-4xl mx-auto rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/60 gap-3">
          {/* Mac / Terminal Window Control Dots */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
          </div>

          {/* Cybernetic Terminal Prompt Line */}
          <div className="flex items-center gap-2 truncate text-slate-400 text-[11px] sm:text-xs">
            <span className="text-yellow-400 font-bold">➜</span>
            <span className="text-cyan-400 font-semibold">~</span>
            <span className="text-white font-medium">vgadream-ctl</span>
            <span className="opacity-40">&bull;</span>
            <span className="truncate">
              &copy; {new Date().getFullYear()}{' '}
              <span className="text-white font-semibold">VGADream</span>
            </span>
            <span className="opacity-40">&bull;</span>
            <span className="truncate">
              Crafted by{' '}
              <a
                href="https://faaadelmr.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline font-semibold transition-colors"
              >
                faaadelmr
              </a>
            </span>
          </div>

          {/* Terminal Shell Label */}
          <div className="hidden sm:block text-[10px] text-slate-500 shrink-0 select-none">
            zsh
          </div>
        </div>
      </div>
    </footer>
  );
};
