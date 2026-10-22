/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ImagePreviewProps {
  imageSrc: string;
  errorMessage?: string | null;
  onRetake: () => void;
  onConfirmAnalyze: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageSrc,
  errorMessage,
  onRetake,
  onConfirmAnalyze,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col items-center">
      {/* Editorial Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onRetake}
          className="flex items-center gap-1.5 text-xs text-[#222522] hover:text-[#26352D] font-bold uppercase tracking-wider py-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETAKE / CHOOSE OTHER</span>
        </button>

        <span className="font-spec text-[11px] text-[#26352D] font-bold tracking-widest uppercase">
          CAPTURE CONFIRMATION
        </span>
      </div>

      {/* Captured Photograph Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#222522] border border-[#26352D]/30 shadow-md overflow-hidden">
        <img
          src={imageSrc}
          alt="Captured material specimen"
          className="w-full h-full object-cover"
        />

        {/* Minimal Swiss Stamp in Corner */}
        <div className="absolute bottom-3 left-3 bg-[#26352D]/90 text-[#F5F3ED] px-2.5 py-1 text-[10px] font-spec tracking-widest uppercase backdrop-blur-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-[#8A9A86]" />
          <span>SPECIMEN READY FOR MULTIMODAL INFERENCE</span>
        </div>
      </div>

      {/* Error Alert if Previous Attempt Failed */}
      {errorMessage && (
        <div className="w-full mt-4 p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5 text-left">
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider block font-spec text-[10px] text-red-800">
              INFERENCE NOTICE
            </span>
            <p className="mt-0.5 leading-relaxed text-[11px]">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Confirmation Description */}
      <div className="w-full mt-5 mb-6 text-center">
        <h2 className="text-lg font-black tracking-tight text-[#222522] uppercase">
          {errorMessage ? 'RETRY MATERIAL ANALYSIS' : 'CONFIRM MATERIAL SPECIMEN'}
        </h2>
        <p className="text-xs text-[#222522]/70 max-w-sm mx-auto mt-1 leading-relaxed">
          {errorMessage
            ? 'You can retry analyzing this specimen or retake the photograph under better lighting.'
            : 'Ensure the photograph clearly highlights grain, surface texture, and joinery before running AI material intelligence.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetake}
          className="w-full sm:w-1/2 py-3 px-4 border border-[#26352D]/30 hover:border-[#26352D] bg-[#F5F3ED] text-[#222522] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>RETAKE PHOTO</span>
        </button>

        <button
          onClick={onConfirmAnalyze}
          className="w-full sm:w-1/2 py-3 px-4 bg-[#26352D] hover:bg-[#1a251f] text-[#F5F3ED] text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4 text-[#8A9A86]" />
          <span>{errorMessage ? 'RETRY ANALYSIS →' : 'ANALYZE MATERIAL →'}</span>
        </button>
      </div>
    </div>
  );
};
