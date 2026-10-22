/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AnalyzingViewProps {
  imageSrc: string;
}

const STATUS_MESSAGES = [
  'EXAMINING MATERIAL SURFACE & GRAIN...',
  'ANALYZING MECHANICAL & THERMAL PROPERTIES...',
  'EVALUATING CIRCULARITY & END-OF-LIFE STREAMS...',
  'EXPLORING REPAIR, REUSE & REDESIGN VECTORS...',
  'SYNTHESIZING INDUSTRIAL DESIGN SPECIFICATION...',
];

export const AnalyzingView: React.FC<AnalyzingViewProps> = ({ imageSrc }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Header Indicator */}
      <div className="w-full flex items-center justify-between mb-4">
        <span className="font-spec text-[11px] text-[#26352D] font-bold tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#26352D] animate-ping" />
          MULTIMODAL INFERENCE IN PROGRESS
        </span>
        <span className="font-spec text-[11px] text-[#222522]/60 uppercase">
          GEMINI 3.8 FLASH
        </span>
      </div>

      {/* Image Container with Architectural Scanning Beam */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#222522] border border-[#26352D]/40 shadow-xl overflow-hidden">
        <img
          src={imageSrc}
          alt="Material specimen under analysis"
          className="w-full h-full object-cover filter brightness-95"
        />

        {/* Dark overlay with architectural grid */}
        <div
          className="absolute inset-0 bg-[#26352D]/20 mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(38, 53, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(38, 53, 45, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Animated Laser / Optical Scanline */}
        <div className="absolute left-0 right-0 h-0.5 bg-[#8A9A86] shadow-[0_0_12px_#8A9A86] animate-scanline pointer-events-none" />

        {/* Corner alignment markers */}
        <div className="absolute top-3 left-3 text-[10px] font-spec text-[#F5F3ED] bg-[#26352D]/80 px-2 py-0.5">
          SPECTRAL SCAN: ACTIVE
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] font-spec text-[#F5F3ED] bg-[#26352D]/80 px-2 py-0.5">
          RESOLUTION: HIGH DENSITY
        </div>
      </div>

      {/* Rotating Status Messages & Progress */}
      <div className="w-full mt-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-[#26352D] font-spec text-sm font-bold tracking-wider mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#26352D]" />
          <span className="transition-opacity duration-300">
            {STATUS_MESSAGES[currentMessageIndex]}
          </span>
        </div>

        <p className="text-xs text-[#222522]/60 max-w-md leading-relaxed">
          The image is being analyzed by Google Gemini vision models to evaluate surface grain, light interaction, and manufacturing markers.
        </p>

        {/* Subtle Step Counter */}
        <div className="flex gap-2 mt-4">
          {STATUS_MESSAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 w-8 rounded-none transition-all duration-300 ${
                idx === currentMessageIndex
                  ? 'bg-[#26352D]'
                  : idx < currentMessageIndex
                  ? 'bg-[#8A9A86]'
                  : 'bg-[#26352D]/15'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
