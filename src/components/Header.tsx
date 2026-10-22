/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Archive, Info, Sparkles, Camera } from 'lucide-react';

interface HeaderProps {
  archiveCount: number;
  onOpenArchive: () => void;
  onOpenAbout: () => void;
  onStartScan: () => void;
  onGoHome: () => void;
  currentScreen: 'home' | 'camera' | 'preview' | 'analyzing' | 'results';
}

export const Header: React.FC<HeaderProps> = ({
  archiveCount,
  onOpenArchive,
  onOpenAbout,
  onStartScan,
  onGoHome,
  currentScreen,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#F5F3ED]/90 backdrop-blur-md border-b border-[#26352D]/15 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 group text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#26352D]"
          aria-label="MATTER Home"
        >
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-[#222522] group-hover:text-[#26352D] transition-colors">
            MATTER.
          </span>
          <span className="hidden sm:inline-block text-[10px] tracking-widest uppercase text-[#26352D]/70 font-spec border-l border-[#26352D]/20 pl-2">
            AI Material Intelligence
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-[#222522]/80">
          <button
            onClick={onOpenArchive}
            className="flex items-center gap-1.5 hover:text-[#26352D] transition-colors py-1 cursor-pointer whitespace-nowrap"
            aria-label={`Open specimen archive, ${archiveCount} saved items`}
          >
            <Archive className="w-3.5 h-3.5 text-[#26352D]" />
            <span>ARCHIVE</span>
            {archiveCount > 0 && (
              <span className="font-spec text-[11px] font-bold text-[#26352D] tabular-nums">
                ({archiveCount})
              </span>
            )}
          </button>

          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1 hover:text-[#26352D] transition-colors py-1 cursor-pointer whitespace-nowrap"
            aria-label="About MATTER philosophy"
          >
            <Info className="w-3.5 h-3.5 text-[#26352D]" />
            <span className="hidden xs:inline">PHILOSOPHY</span>
            <span className="xs:hidden">ABOUT</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center shrink-0">
          {currentScreen !== 'camera' && currentScreen !== 'analyzing' ? (
            <button
              onClick={onStartScan}
              className="px-3.5 sm:px-4 py-2 bg-[#26352D] hover:bg-[#1a251f] active:scale-[0.98] text-[#F5F3ED] text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SCAN MATERIAL</span>
              <span className="sm:hidden">SCAN</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              onClick={onGoHome}
              className="px-3 py-1.5 border border-[#26352D]/30 hover:border-[#26352D] text-[#222522] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
