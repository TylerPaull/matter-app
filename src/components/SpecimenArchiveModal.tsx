/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MaterialAnalysis } from '../utils/material-schema.ts';
import { X, Trash2, ArrowUpRight, Download, Archive, Calendar } from 'lucide-react';

interface SpecimenArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAnalyses: MaterialAnalysis[];
  onSelectSpecimen: (analysis: MaterialAnalysis) => void;
  onRemoveSpecimen: (specimenId: string) => void;
  onClearArchive: () => void;
}

export const SpecimenArchiveModal: React.FC<SpecimenArchiveModalProps> = ({
  isOpen,
  onClose,
  savedAnalyses,
  onSelectSpecimen,
  onRemoveSpecimen,
  onClearArchive,
}) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedAnalyses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `matter-material-archive-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222522]/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#F5F3ED] border border-[#26352D]/30 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#26352D]/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-[#26352D]" />
            <h2 className="text-base font-black tracking-tight text-[#222522] uppercase">
              SPECIMEN ARCHIVE ({savedAnalyses.length})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#26352D]/10 text-[#222522] transition-colors cursor-pointer"
            aria-label="Close archive dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {savedAnalyses.length === 0 ? (
            <div className="text-center py-12 text-[#222522]/60">
              <Archive className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#26352D]" />
              <p className="font-spec text-xs tracking-wider uppercase">NO SPECIMENS IN ARCHIVE</p>
              <p className="text-xs text-[#222522]/50 mt-1 max-w-xs mx-auto">
                Scan material surfaces or select sample specimens to bookmark them in your personal reference library.
              </p>
            </div>
          ) : (
            savedAnalyses.map((item) => (
              <div
                key={item.specimenId}
                className="group border border-[#26352D]/15 hover:border-[#26352D] bg-white/70 p-3.5 transition-all flex items-center justify-between gap-4"
              >
                {/* Thumbnail / Tag */}
                <div className="w-12 h-12 bg-[#222522] shrink-0 border border-[#26352D]/20 overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.identification.materialName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-spec text-[9px] text-[#F5F3ED]">MAT</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectSpecimen(item)}>
                  <div className="flex items-center gap-2 text-[10px] font-spec text-[#26352D]">
                    <span className="font-bold">{item.specimenId}</span>
                    <span className="text-[#222522]/30">·</span>
                    <span className="text-[#222522]/60">
                      {new Date(item.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#222522] truncate uppercase group-hover:text-[#26352D] transition-colors">
                    {item.identification.materialName}
                  </h3>
                  <p className="text-xs text-[#222522]/60 truncate">
                    {item.identification.classification} · {item.identification.confidence} CONFIDENCE
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onSelectSpecimen(item)}
                    className="p-2 text-[#26352D] hover:bg-[#26352D]/10 transition-colors cursor-pointer"
                    title="Open Specimen"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveSpecimen(item.specimenId)}
                    className="p-2 text-[#222522]/50 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove from archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {savedAnalyses.length > 0 && (
          <div className="px-6 py-3 border-t border-[#26352D]/15 bg-[#F5F3ED] flex items-center justify-between text-xs">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#26352D] hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT JSON</span>
            </button>

            <button
              onClick={onClearArchive}
              className="font-spec text-[11px] text-red-700/80 hover:text-red-700 uppercase tracking-wider cursor-pointer"
            >
              CLEAR ALL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
