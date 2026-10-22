/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Layers, Compass, ShieldAlert, Cpu } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222522]/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#F5F3ED] border border-[#26352D]/30 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#26352D]/15 flex items-center justify-between">
          <div>
            <span className="font-spec text-[10px] text-[#26352D] font-bold tracking-widest uppercase">
              ABOUT MATTER.
            </span>
            <h2 className="text-base font-black tracking-tight text-[#222522] uppercase">
              AI MATERIAL INTELLIGENCE
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#26352D]/10 text-[#222522] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#222522] leading-relaxed">
          {/* Tagline */}
          <div className="border-l-2 border-[#26352D] pl-3 py-1">
            <p className="font-black text-sm uppercase tracking-tight text-[#222522]">
              "EVERY MATERIAL HAS A STORY. UNDERSTAND WHAT THINGS ARE MADE OF."
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#26352D]">
              <Compass className="w-3.5 h-3.5" />
              <span>THE PURPOSE</span>
            </div>
            <p>
              MATTER is an architectural-grade material identification and circular design companion developed for industrial designers, architects, and curious individuals. By observing physical artifacts through smartphone optics, users decode the material origins, manufacturing processes, and circular redesign possibilities of everyday objects.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#26352D]">
              <Cpu className="w-3.5 h-3.5" />
              <span>HOW GEMINI MULTIMODAL VISION IS APPLIED</span>
            </div>
            <p>
              When an image is photographed or uploaded, raw pixel data is transmitted to server-side Google Gemini models. Gemini evaluates visible specular highlights, micro-texture, parting line artifacts, fastener types, and surface finishes to deduce material family, physical performance, and manufacturing taxonomy.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 bg-white/60 p-3.5 border border-[#26352D]/15">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#26352D]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>ACCURACY TRANSPARENCY & LIMITATIONS</span>
            </div>
            <p className="text-[11px] text-[#222522]/80 leading-normal">
              Visual optical inspection cannot determine chemical elemental composition, exact polymer molecular weight, or internal alloy tempering with laboratory certitude. MATTER intentionally expresses confidence qualitatively (HIGH, MODERATE, LOW) and pairs every identification with practical non-destructive field verification tests (thermal conductivity, tap resonance, magnet response).
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#26352D]">
              <Layers className="w-3.5 h-3.5" />
              <span>THE CIRCULAR DESIGN HIERARCHY</span>
            </div>
            <p>
              True sustainability prioritizes longevity before recycling. MATTER's redesign engine suggests actionable pathways in strict priority order:
            </p>
            <ol className="list-decimal pl-4 space-y-1 font-medium">
              <li><strong>REPAIR:</strong> Extending the primary lifespan of existing components.</li>
              <li><strong>REUSE:</strong> Repurposing unblemished structural elements without reprocessing.</li>
              <li><strong>REIMAGINE:</strong> Closed-loop architectural and circular redesign opportunities.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#26352D]/15 bg-[#F5F3ED] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#26352D] text-[#F5F3ED] text-xs font-bold uppercase tracking-wider hover:bg-[#1a251f] transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
