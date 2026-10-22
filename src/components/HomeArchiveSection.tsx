/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MaterialAnalysis } from '../utils/material-schema.ts';
import {
  Archive,
  Search,
  ArrowRight,
  Download,
  Trash2,
  Camera,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface HomeArchiveSectionProps {
  savedArchive: MaterialAnalysis[];
  onSelectSpecimen: (specimen: MaterialAnalysis) => void;
  onDeleteSpecimen: (specimenId: string) => void;
  onClearArchive: () => void;
  onStartScan: () => void;
}

export const HomeArchiveSection: React.FC<HomeArchiveSectionProps> = ({
  savedArchive,
  onSelectSpecimen,
  onDeleteSpecimen,
  onClearArchive,
  onStartScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Extract unique classifications for filter tabs
  const categories = useMemo(() => {
    const set = new Set<string>();
    savedArchive.forEach((item) => {
      if (item.identification?.classification) {
        set.add(item.identification.classification.split('/')[0].trim().toUpperCase());
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [savedArchive]);

  // Filter items based on search query and category
  const filteredArchive = useMemo(() => {
    return savedArchive.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const name = item.identification?.materialName?.toLowerCase() || '';
      const classification = item.identification?.classification?.toLowerCase() || '';
      const characteristics = item.identification?.visibleCharacteristics?.toLowerCase() || '';
      const id = item.specimenId?.toLowerCase() || '';

      const matchesQuery =
        !query ||
        name.includes(query) ||
        classification.includes(query) ||
        characteristics.includes(query) ||
        id.includes(query);

      const matchesCategory =
        selectedCategory === 'ALL' ||
        classification.toUpperCase().includes(selectedCategory);

      return matchesQuery && matchesCategory;
    });
  }, [savedArchive, searchQuery, selectedCategory]);

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(savedArchive, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `matter-specimen-archive-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section className="w-full max-w-5xl mt-14 pt-10 border-t-2 border-[#26352D] scroll-mt-20" id="home-archive">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Archive className="w-4 h-4 text-[#26352D]" />
            <span className="font-spec text-xs tracking-widest text-[#26352D] uppercase font-bold">
              SPECIMEN ARCHIVE & PREVIOUS SCANS
            </span>
            <div className="flex items-center gap-1 bg-[#26352D]/10 text-[#26352D] px-2 py-0.5 text-[9px] font-spec font-bold uppercase tracking-wider ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>LIVE CLOUD SYNCED (PHONE + COMPUTER)</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#222522] uppercase tracking-tight">
            ALL DOCUMENTED MATERIAL SPECIMENS
          </h2>
          <p className="text-xs sm:text-sm text-[#222522]/70 mt-1 max-w-xl">
            Browse and inspect complete technical specification sheets from your recent scans and saved reference specimens.
          </p>
        </div>

        {/* Global Archive Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs">
          {savedArchive.length > 0 && (
            <>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 border border-[#26352D]/30 hover:border-[#26352D] bg-white/60 text-[#222522] font-spec text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                title="Download archive as JSON"
              >
                <Download className="w-3.5 h-3.5 text-[#26352D]" />
                <span className="hidden sm:inline">EXPORT JSON</span>
                <span className="sm:hidden">EXPORT</span>
              </button>

              <button
                onClick={onClearArchive}
                className="px-3 py-1.5 border border-red-200 hover:border-red-400 bg-red-50/50 text-red-800 font-spec text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                title="Clear all saved scans"
              >
                CLEAR
              </button>
            </>
          )}

          <button
            onClick={onStartScan}
            className="px-3.5 py-1.5 bg-[#26352D] hover:bg-[#1a251f] text-[#F5F3ED] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>NEW SCAN</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/70 border border-[#26352D]/15 p-3.5 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#26352D]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archive by material name, classification, or grain..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent border-b border-[#26352D]/20 focus:border-[#26352D] focus:outline-none placeholder:text-[#222522]/40 text-[#222522] font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#222522]/40 hover:text-[#222522] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills/Tabs */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-[10px] font-spec">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors border ${
                  selectedCategory === cat
                    ? 'bg-[#26352D] text-[#F5F3ED] border-[#26352D]'
                    : 'bg-white/40 text-[#222522]/70 border-[#26352D]/15 hover:border-[#26352D]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Archive Specimens */}
      {filteredArchive.length === 0 ? (
        <div className="border border-dashed border-[#26352D]/30 p-12 text-center bg-white/40">
          <Layers className="w-8 h-8 mx-auto mb-2 text-[#26352D]/40" />
          <h3 className="font-spec text-xs font-bold uppercase tracking-wider text-[#222522]">
            {savedArchive.length === 0
              ? 'NO SPECIMENS IN ARCHIVE YET'
              : 'NO SPECIMENS MATCH YOUR SEARCH CRITERIA'}
          </h3>
          <p className="text-xs text-[#222522]/60 mt-1 max-w-sm mx-auto leading-relaxed">
            {savedArchive.length === 0
              ? 'Scan any object surface with your camera to identify materials and automatically save records here.'
              : 'Try clearing your search query or switching category filters.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-3.5 py-2 border border-[#26352D]/30 hover:border-[#26352D] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                RESET FILTERS
              </button>
            )}
            <button
              onClick={onStartScan}
              className="px-4 py-2 bg-[#26352D] hover:bg-[#1a251f] text-[#F5F3ED] text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>SCAN FIRST OBJECT</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArchive.map((specimen) => (
            <article
              key={specimen.specimenId}
              className="group border border-[#26352D]/20 hover:border-[#26352D] bg-white/80 p-4 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-sm"
            >
              <div>
                {/* Specimen Photograph Preview */}
                <div
                  onClick={() => onSelectSpecimen(specimen)}
                  className="relative aspect-[16/10] bg-[#1a201c] mb-3 overflow-hidden border border-[#26352D]/20 cursor-pointer"
                >
                  {specimen.imageUrl ? (
                    <img
                      src={specimen.imageUrl}
                      alt={specimen.identification.materialName}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-spec text-[10px] text-[#F5F3ED]/60">
                      NO IMAGE RECORDED
                    </div>
                  )}

                  {/* Top Bar Specimen ID Stamp */}
                  <div className="absolute top-2 left-2 bg-[#26352D]/90 text-[#F5F3ED] text-[9px] font-spec tracking-widest uppercase px-2 py-0.5 backdrop-blur-xs flex items-center gap-1">
                    <span>{specimen.specimenId}</span>
                  </div>

                  {/* Confidence Badge */}
                  <div className="absolute bottom-2 right-2 bg-white/90 text-[#26352D] text-[9px] font-spec font-bold tracking-wider uppercase px-1.5 py-0.5">
                    {specimen.identification.confidence} CONFIDENCE
                  </div>
                </div>

                {/* Metadata Header */}
                <div className="flex items-center justify-between text-[10px] font-spec text-[#222522]/60 mb-1">
                  <span className="uppercase text-[#26352D] font-bold">
                    {specimen.identification.classification}
                  </span>
                  <span>
                    {new Date(specimen.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Primary Material Title */}
                <h3
                  onClick={() => onSelectSpecimen(specimen)}
                  className="text-sm font-black text-[#222522] uppercase tracking-tight group-hover:text-[#26352D] transition-colors cursor-pointer leading-snug line-clamp-2"
                >
                  {specimen.identification.materialName}
                </h3>

                {/* Visible Characteristics Excerpt */}
                <p className="text-xs text-[#222522]/70 mt-2 line-clamp-2 leading-relaxed">
                  {specimen.identification.visibleCharacteristics}
                </p>

                {/* Key Properties Snippet */}
                {specimen.properties?.typicalApplications && specimen.properties.typicalApplications.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#26352D]/10 flex flex-wrap gap-1">
                    {specimen.properties.typicalApplications.slice(0, 2).map((app, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-spec text-[#222522]/70 bg-[#F5F3ED] px-1.5 py-0.5 border border-[#26352D]/10 truncate max-w-[140px]"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-[#26352D]/15 flex items-center justify-between">
                <button
                  onClick={() => onSelectSpecimen(specimen)}
                  className="font-spec text-[11px] font-bold text-[#26352D] group-hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>INSPECT SPEC SHEET</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => onDeleteSpecimen(specimen.specimenId)}
                  className="p-1.5 text-[#222522]/40 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove from archive"
                  aria-label={`Remove ${specimen.identification.materialName} from archive`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
