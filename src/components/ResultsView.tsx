/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MaterialAnalysis,
  formatAnalysisAsText,
} from '../utils/material-schema.ts';
import {
  Camera,
  Copy,
  Share2,
  Check,
  Bookmark,
  BookmarkCheck,
  Printer,
  Wrench,
  Repeat,
  Lightbulb,
  ShieldCheck,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface ResultsViewProps {
  analysis: MaterialAnalysis;
  onScanAnother: () => void;
  isSavedInArchive: boolean;
  onToggleSaveArchive: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  analysis,
  onScanAnother,
  isSavedInArchive,
  onToggleSaveArchive,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const { identification, properties, sustainability, redesign, designInsight, specimenId, timestamp, imageUrl } =
    analysis;

  const dateFormatted = new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyAnalysis = async () => {
    try {
      const text = formatAnalysisAsText(analysis);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  const handleShare = async () => {
    const textReport = formatAnalysisAsText(analysis);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MATTER Specimen ${specimenId} — ${identification.materialName}`,
          text: `Material Analysis for ${identification.materialName} (${identification.classification})\n\nIdentified via MATTER AI Material Intelligence.\n\n${textReport.slice(0, 500)}...`,
        });
        setShareFeedback('Shared successfully');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyAnalysis();
        }
      }
    } else {
      handleCopyAnalysis();
      setShareFeedback('Copied spec sheet to clipboard');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-24">
      {/* Action Toolbar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26352D]/15 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-spec text-xs font-bold text-[#26352D] uppercase tracking-wider">
            SPECIMEN / {specimenId}
          </span>
          <span className="text-xs text-[#222522]/40">·</span>
          <span className="font-spec text-xs text-[#222522]/60">{dateFormatted}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onToggleSaveArchive}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 border ${
              isSavedInArchive
                ? 'bg-[#26352D] text-[#F5F3ED] border-[#26352D]'
                : 'border-[#26352D]/30 hover:border-[#26352D] text-[#222522]'
            }`}
            title="Save or remove from your local archive"
          >
            {isSavedInArchive ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SAVED</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SAVE</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyAnalysis}
            className="px-3 py-1.5 border border-[#26352D]/30 hover:border-[#26352D] text-[#222522] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            title="Copy full text analysis to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#26352D]" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 border border-[#26352D]/30 hover:border-[#26352D] text-[#222522] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            title="Share material analysis"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SHARE</span>
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex px-3 py-1.5 border border-[#26352D]/30 hover:border-[#26352D] text-[#222522] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer items-center gap-1.5"
            title="Print or export spec sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT</span>
          </button>

          <button
            onClick={onScanAnother}
            className="hidden sm:flex px-3.5 py-1.5 bg-[#26352D] hover:bg-[#1a251f] text-[#F5F3ED] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer items-center gap-1.5 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>SCAN ANOTHER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {shareFeedback && (
        <div className="no-print mb-4 p-2 bg-[#26352D] text-[#F5F3ED] text-xs font-spec text-center tracking-wider uppercase">
          {shareFeedback}
        </div>
      )}

      {/* Contemporary Specification Sheet Document */}
      <article className="border border-[#26352D]/20 bg-[#F5F3ED] p-6 sm:p-10 shadow-sm print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-[#26352D] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-spec text-xs tracking-widest text-[#26352D] uppercase font-bold mb-1">
              MATERIAL SPECIFICATION RECORD
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#222522] uppercase">
              {identification.materialName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-[#222522]/80 font-medium">
              <span className="text-[#26352D] font-bold">{identification.classification}</span>
              <span aria-hidden="true" className="text-[#26352D]/40">/</span>
              <span>EVALUATION CONFIDENCE: <strong className="text-[#26352D] font-spec">{identification.confidence}</strong></span>
              <span aria-hidden="true" className="text-[#26352D]/40">/</span>
              <span className="font-spec text-[#222522]/60">{specimenId}</span>
            </div>
          </div>

          <div className="text-left md:text-right font-spec text-[11px] text-[#222522]/60">
            <div>MATTER. ARCHIVE REFERENCE</div>
            <div>VERIFIED MULTIMODAL GEMINI INFERENCE</div>
          </div>
        </div>

        {/* Specimen Photograph & Visual Identification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 pb-8 border-b border-[#26352D]/15">
          {/* Specimen Photograph */}
          <div className="md:col-span-5 flex flex-col">
            <div className="relative aspect-[4/3] bg-[#222522] border border-[#26352D]/20 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={identification.materialName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-spec text-[#D8D4C7]">
                  PHOTOGRAPH ARCHIVED
                </div>
              )}
              <div className="absolute top-2 left-2 bg-[#26352D]/90 text-[#F5F3ED] text-[9px] font-spec tracking-widest uppercase px-2 py-0.5">
                EXAMINED PHOTOGRAPH
              </div>
            </div>
            <div className="mt-2 text-[10px] font-spec text-[#222522]/60 flex justify-between">
              <span>REF: {specimenId}</span>
              <span>100% VISUAL GROUNDING</span>
            </div>
          </div>

          {/* Section 01 / Identification Details */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="font-spec text-xs font-bold text-[#26352D] uppercase tracking-wider mb-2">
                01 / IDENTIFICATION & VISUAL CHARACTERISTICS
              </div>
              <p className="text-sm leading-relaxed text-[#222522] mb-4">
                {identification.visibleCharacteristics}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#26352D]/10">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="text-[#222522]/60 uppercase font-spec text-[11px]">SECONDARY MATERIALS</span>
                <span className="col-span-2 text-[#222522] font-medium">
                  {identification.secondaryMaterials.length > 0
                    ? identification.secondaryMaterials.join(', ')
                    : 'None detected (monolithic substrate)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="text-[#222522]/60 uppercase font-spec text-[11px]">CLASSIFICATION</span>
                <span className="col-span-2 text-[#222522] font-medium">
                  {identification.classification}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="text-[#222522]/60 uppercase font-spec text-[11px]">ASSESSMENT CONFIDENCE</span>
                <span className="col-span-2 text-[#26352D] font-bold font-spec">
                  {identification.confidence} (Qualitative Visual Assessment)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 02 / Material Properties */}
        <section className="py-8 border-b border-[#26352D]/15">
          <h2 className="font-spec text-xs font-bold text-[#26352D] uppercase tracking-widest mb-6">
            02 / MATERIAL BEHAVIOR & PROPERTIES
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase">DURABILITY & WEAR</div>
              <div className="text-sm text-[#222522] font-medium leading-snug">{properties.durability}</div>
            </div>

            <div className="space-y-1">
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase">STRUCTURAL BEHAVIOR</div>
              <div className="text-sm text-[#222522] font-medium leading-snug">{properties.structuralBehavior}</div>
            </div>

            <div className="space-y-1">
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase">RIGIDITY / FLEXIBILITY</div>
              <div className="text-sm text-[#222522] font-medium leading-snug">{properties.rigidityOrFlexibility}</div>
            </div>

            <div className="space-y-1">
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase">SURFACE TEXTURE & FINISH</div>
              <div className="text-sm text-[#222522] font-medium leading-snug">{properties.surfaceTextureAndFinish}</div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase">ENVIRONMENTAL RESISTANCE</div>
              <div className="text-sm text-[#222522] font-medium leading-snug">{properties.environmentalResistance}</div>
            </div>
          </div>

          {/* Manufacturing and Applications Strips */}
          <div className="mt-6 pt-6 border-t border-[#26352D]/10 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase mb-2">COMMON MANUFACTURING PROCESSES</div>
              <div className="flex flex-wrap gap-1.5">
                {properties.manufacturingProcesses.map((proc, i) => (
                  <span
                    key={i}
                    className="border border-[#26352D]/20 bg-white/50 px-2.5 py-1 text-xs text-[#222522] font-medium"
                  >
                    {proc}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="font-spec text-[11px] text-[#222522]/60 uppercase mb-2">TYPICAL DESIGN & ARCHITECTURAL APPLICATIONS</div>
              <div className="flex flex-wrap gap-1.5">
                {properties.typicalApplications.map((app, i) => (
                  <span
                    key={i}
                    className="border border-[#26352D]/20 bg-white/50 px-2.5 py-1 text-xs text-[#222522] font-medium"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 03 / Sustainability & Circularity */}
        <section className="py-8 border-b border-[#26352D]/15">
          <h2 className="font-spec text-xs font-bold text-[#26352D] uppercase tracking-widest mb-6">
            03 / CIRCULARITY & SUSTAINABILITY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 border border-[#26352D]/20 bg-[#F5F3ED] flex flex-col justify-between">
              <div>
                <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase mb-1">RECYCLABILITY STREAM</div>
                <p className="text-xs text-[#222522] leading-relaxed">{sustainability.recyclability}</p>
              </div>
            </div>

            <div className="p-4 border border-[#26352D]/20 bg-[#F5F3ED] flex flex-col justify-between">
              <div>
                <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase mb-1">REUSABILITY POTENTIAL</div>
                <p className="text-xs text-[#222522] leading-relaxed">{sustainability.reusability}</p>
              </div>
            </div>

            <div className="p-4 border border-[#26352D]/20 bg-[#F5F3ED] flex flex-col justify-between">
              <div>
                <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase mb-1">REPAIRABILITY & RESTORATION</div>
                <p className="text-xs text-[#222522] leading-relaxed">{sustainability.repairability}</p>
              </div>
            </div>

            <div className="p-4 border border-[#26352D]/20 bg-[#F5F3ED] flex flex-col justify-between">
              <div>
                <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase mb-1">ESTIMATED LONGEVITY</div>
                <p className="text-xs text-[#222522] leading-relaxed">{sustainability.longevity}</p>
              </div>
            </div>

            <div className="p-4 border border-[#26352D]/20 bg-[#F5F3ED] flex flex-col justify-between sm:col-span-2">
              <div>
                <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase mb-1">
                  ENVIRONMENTAL & END-OF-LIFE CONSIDERATIONS
                </div>
                <p className="text-xs text-[#222522] leading-relaxed mb-2">
                  <strong className="text-[#222522]/80">Extraction & Processing:</strong> {sustainability.environmentalConcerns}
                </p>
                <p className="text-xs text-[#222522] leading-relaxed">
                  <strong className="text-[#222522]/80">Separation:</strong> {sustainability.endOfLifeAndSeparation}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 04 / Reuse + Redesign Recommendations */}
        <section className="py-8 border-b border-[#26352D]/15">
          <div className="mb-6">
            <h2 className="font-spec text-xs font-bold text-[#26352D] uppercase tracking-widest">
              04 / CIRCULAR DESIGN ACTION: REPAIR, REUSE, REIMAGINE
            </h2>
            <p className="text-xs text-[#222522]/70 mt-1">
              Three context-specific recommendations tailored to the scanned object and material properties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* REPAIR CARD */}
            <div className="border border-[#26352D]/20 p-5 bg-white/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-[#26352D] text-[#F5F3ED]">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-spec text-[10px] text-[#26352D] font-bold tracking-widest uppercase">
                      ACTION 01
                    </span>
                    <h3 className="text-sm font-black uppercase text-[#222522]">REPAIR & RESTORE</h3>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#26352D] mb-1.5">{redesign.repair.title}</h4>
                <p className="text-xs text-[#222522]/80 leading-relaxed mb-4">
                  {redesign.repair.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#26352D]/10">
                <span className="font-spec text-[10px] text-[#222522]/60 uppercase block mb-1">RECOMMENDED TOOLS:</span>
                <div className="flex flex-wrap gap-1">
                  {redesign.repair.toolsOrMethods.map((tool, idx) => (
                    <span key={idx} className="text-[11px] font-spec text-[#26352D] bg-[#F5F3ED] px-1.5 py-0.5 border border-[#26352D]/15">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* REUSE CARD */}
            <div className="border border-[#26352D]/20 p-5 bg-white/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-[#26352D] text-[#F5F3ED]">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-spec text-[10px] text-[#26352D] font-bold tracking-widest uppercase">
                      ACTION 02
                    </span>
                    <h3 className="text-sm font-black uppercase text-[#222522]">REPURPOSE & REUSE</h3>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#26352D] mb-1.5">{redesign.reuse.title}</h4>
                <p className="text-xs text-[#222522]/80 leading-relaxed mb-4">
                  {redesign.reuse.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#26352D]/10">
                <span className="font-spec text-[10px] text-[#222522]/60 uppercase block mb-1">SUITABILITY RATIONALE:</span>
                <p className="text-[11px] text-[#222522] leading-tight">
                  {redesign.reuse.suitability}
                </p>
              </div>
            </div>

            {/* REIMAGINE CARD */}
            <div className="border border-[#26352D]/20 p-5 bg-white/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-[#26352D] text-[#F5F3ED]">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-spec text-[10px] text-[#26352D] font-bold tracking-widest uppercase">
                      ACTION 03
                    </span>
                    <h3 className="text-sm font-black uppercase text-[#222522]">REIMAGINE & REDESIGN</h3>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#26352D] mb-1.5">{redesign.reimagine.title}</h4>
                <p className="text-xs text-[#222522]/80 leading-relaxed mb-4">
                  {redesign.reimagine.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#26352D]/10">
                <span className="font-spec text-[10px] text-[#26352D] font-bold uppercase block mb-1">CIRCULAR REDESIGN VECTOR:</span>
                <p className="text-[11px] text-[#222522] leading-tight font-medium">
                  {redesign.reimagine.circularConcept}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 05 / Industrial Design Insight & Physical Verification */}
        <section className="pt-8">
          <h2 className="font-spec text-xs font-bold text-[#26352D] uppercase tracking-widest mb-4">
            05 / INDUSTRIAL DESIGN INSIGHT & FIELD VERIFICATION
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="border-l-2 border-[#26352D] pl-4 space-y-2">
              <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>DESIGN & MANUFACTURING RATIONALE</span>
              </div>
              <p className="text-xs text-[#222522] leading-relaxed">
                {designInsight.industrialDesignContext}
              </p>
            </div>

            <div className="border-l-2 border-[#8A9A86] pl-4 space-y-2">
              <div className="font-spec text-[11px] text-[#26352D] font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#26352D]" />
                <span>NON-DESTRUCTIVE VERIFICATION TESTS</span>
              </div>
              <p className="text-xs text-[#222522] leading-relaxed">
                {designInsight.verificationGuidance}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#26352D]/10 text-center">
            <p className="text-[10px] font-spec text-[#222522]/50 uppercase tracking-widest">
              MATTER. AI MATERIAL INTELLIGENCE · DESIGNED FOR CIRCULAR DESIGNERS & ARCHITECTS
            </p>
          </div>
        </section>
      </article>

      {/* Floating Bottom Action for Mobile */}
      <div className="no-print fixed bottom-4 left-4 right-4 sm:hidden z-30">
        <button
          onClick={onScanAnother}
          className="w-full py-3 px-6 bg-[#26352D] text-[#F5F3ED] font-bold text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Camera className="w-4 h-4" />
          <span>SCAN ANOTHER OBJECT →</span>
        </button>
      </div>
    </div>
  );
};
