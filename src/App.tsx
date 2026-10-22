/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { CameraView } from './components/CameraView.tsx';
import { ImagePreview } from './components/ImagePreview.tsx';
import { AnalyzingView } from './components/AnalyzingView.tsx';
import { ResultsView } from './components/ResultsView.tsx';
import { SpecimenArchiveModal } from './components/SpecimenArchiveModal.tsx';
import { HomeArchiveSection } from './components/HomeArchiveSection.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { SAMPLE_MATERIALS, SampleMaterial } from './data/sample-materials.ts';
import { MaterialAnalysis } from './utils/material-schema.ts';
import { optimizeImageForAnalysis } from './utils/image-compress.ts';
import {
  loadSpecimensFromIDB,
  saveSpecimenToIDB,
  deleteSpecimenFromIDB,
  clearAllSpecimensFromIDB,
} from './utils/archive-storage.ts';
import {
  subscribeToSharedSpecimens,
  saveSpecimenToCloud,
  deleteSpecimenFromCloud,
  testFirestoreConnection,
} from './utils/firebase.ts';
import { Camera, Upload, ArrowRight, Sparkles, Layers, RefreshCw, AlertTriangle } from 'lucide-react';

type ScreenState = 'home' | 'camera' | 'preview' | 'analyzing' | 'results';

const ARCHIVE_STORAGE_KEY = 'matter_specimen_archive_v1';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('home');
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<MaterialAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Archive state persisted in IndexedDB and server-side disk storage
  const [savedArchive, setSavedArchive] = useState<MaterialAnalysis[]>(() => {
    return SAMPLE_MATERIALS.map((sample) => sample.analysis);
  });

  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Hidden file input for direct file upload from home screen
  const fileInputHomeRef = useRef<HTMLInputElement | null>(null);

  // Real-time synchronization across all devices and users via Firebase Firestore
  useEffect(() => {
    let isMounted = true;

    // Test connection on boot per Firestore integration guidelines
    testFirestoreConnection();

    // 1. Immediately read from IndexedDB for instant offline-first UI rendering
    loadSpecimensFromIDB().then((idbSpecimens) => {
      if (isMounted && idbSpecimens.length > 0) {
        setSavedArchive((prev) => {
          const map = new Map<string, MaterialAnalysis>();
          prev.forEach((item) => map.set(item.specimenId, item));
          idbSpecimens.forEach((item) => map.set(item.specimenId, item));
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
      }
    });

    // 2. Real-time Firestore Subscription (Live sync across phone, computer, and all viewers)
    const unsubscribe = subscribeToSharedSpecimens(
      (cloudSpecimens) => {
        if (!isMounted) return;

        if (cloudSpecimens.length === 0) {
          // Initial bootstrap: seed Firestore with all reference specimens + user's bench
          SAMPLE_MATERIALS.forEach((sample) => {
            saveSpecimenToCloud(sample.analysis).catch(() => {});
          });
          return;
        }

        // Merge cloud specimens with reference materials
        const map = new Map<string, MaterialAnalysis>();
        SAMPLE_MATERIALS.forEach((s) => map.set(s.analysis.specimenId, s.analysis));
        cloudSpecimens.forEach((item) => map.set(item.specimenId, item));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setSavedArchive(merged);

        // Update local IndexedDB cache
        for (const item of merged) {
          saveSpecimenToIDB(item);
        }
      },
      (err) => {
        console.warn('Real-time cloud sync notice:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Reset scroll to top on screen transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentScreen]);

  // Support ?autostart=1 query parameter for automated testing / skipping directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && currentScreen === 'home') {
      // Set to first sample specimen to immediately inspect the results view
      handleSelectSample(SAMPLE_MATERIALS[0]);
    }
  }, []);

  const handleStartScan = () => {
    setAnalysisError(null);
    setCurrentScreen('camera');
  };

  const handleCapturePhoto = async (dataUrl: string) => {
    try {
      const optimized = await optimizeImageForAnalysis(dataUrl);
      setSelectedImageSrc(optimized || dataUrl);
    } catch {
      setSelectedImageSrc(dataUrl);
    }
    setCurrentScreen('preview');
  };

  const handleUploadFile = async (file: File) => {
    setAnalysisError(null);
    try {
      const optimized = await optimizeImageForAnalysis(file);
      if (optimized) {
        setSelectedImageSrc(optimized);
        setCurrentScreen('preview');
        return;
      }
    } catch (e) {
      console.warn('Optimization notice:', e);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedImageSrc(result);
        setCurrentScreen('preview');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setSelectedImageSrc(null);
    setCurrentScreen('camera');
  };

  const handleGoHome = () => {
    setCurrentScreen('home');
    setAnalysisError(null);
  };

  const handleExecuteAnalysis = async () => {
    if (!selectedImageSrc) return;

    setCurrentScreen('analyzing');
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: selectedImageSrc,
          mimeType: selectedImageSrc.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete material analysis. Please check your image clarity.');
      }

      const completedAnalysis: MaterialAnalysis = {
        ...data.analysis,
        imageUrl: data.analysis.imageUrl || selectedImageSrc,
      };

      setActiveAnalysis(completedAnalysis);
      setCurrentScreen('results');

      // Auto-save scan into persistent archive
      setSavedArchive((prev) => {
        const filtered = prev.filter((item) => item.specimenId !== completedAnalysis.specimenId);
        return [completedAnalysis, ...filtered];
      });

      // Persist to IndexedDB
      saveSpecimenToIDB(completedAnalysis);

      // Persist to Cloud Firestore (Real-time live sync to computer & all devices)
      saveSpecimenToCloud(completedAnalysis).catch((e) => console.warn('Cloud save error:', e));

      // Persist to Server Storage
      fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimen: completedAnalysis }),
      }).catch((e) => console.warn('Server archive sync notice:', e));
    } catch (err: any) {
      console.warn('Analysis execution note:', err?.message || err);
      const msg = err?.message || 'Unable to complete material analysis. Tap "Retry Analysis" or photograph another angle.';
      setAnalysisError(msg);
      setCurrentScreen('preview');
    }
  };

  const handleSelectSample = (sample: SampleMaterial) => {
    setActiveAnalysis(sample.analysis);
    setSelectedImageSrc(sample.thumbnail);
    setCurrentScreen('results');
  };

  const handleToggleArchiveSave = async () => {
    if (!activeAnalysis) return;
    const exists = savedArchive.some((item) => item.specimenId === activeAnalysis.specimenId);
    if (exists) {
      setSavedArchive((prev) => prev.filter((item) => item.specimenId !== activeAnalysis.specimenId));
      await deleteSpecimenFromIDB(activeAnalysis.specimenId);
      await deleteSpecimenFromCloud(activeAnalysis.specimenId).catch(() => {});
      fetch(`/api/archive/${activeAnalysis.specimenId}`, { method: 'DELETE' }).catch(() => {});
    } else {
      setSavedArchive((prev) => [activeAnalysis, ...prev]);
      await saveSpecimenToIDB(activeAnalysis);
      await saveSpecimenToCloud(activeAnalysis).catch(() => {});
      fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimen: activeAnalysis }),
      }).catch(() => {});
    }
  };

  const handleDeleteSpecimen = async (specimenId: string) => {
    setSavedArchive((prev) => prev.filter((item) => item.specimenId !== specimenId));
    await deleteSpecimenFromIDB(specimenId);
    await deleteSpecimenFromCloud(specimenId).catch(() => {});
    fetch(`/api/archive/${specimenId}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleClearArchive = async () => {
    if (window.confirm('Reset specimen archive to standard reference set?')) {
      await clearAllSpecimensFromIDB();
      try {
        const res = await fetch('/api/archive/clear', { method: 'POST' });
        const data = await res.json();
        if (data.success && Array.isArray(data.archive)) {
          setSavedArchive(data.archive);
          for (const item of data.archive) {
            saveSpecimenToIDB(item);
          }
          return;
        }
      } catch (_) {}
      const fallback = SAMPLE_MATERIALS.map((s) => s.analysis);
      setSavedArchive(fallback);
      for (const item of fallback) {
        saveSpecimenToIDB(item);
      }
    }
  };

  const isCurrentSaved = activeAnalysis
    ? savedArchive.some((item) => item.specimenId === activeAnalysis.specimenId)
    : false;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3ED] text-[#222522]">
      {/* Top Header */}
      <Header
        archiveCount={savedArchive.length}
        onOpenArchive={() => {
          if (currentScreen === 'home') {
            const el = document.getElementById('home-archive');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
              return;
            }
          }
          setIsArchiveOpen(true);
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
        onStartScan={handleStartScan}
        onGoHome={handleGoHome}
        currentScreen={currentScreen}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start">
        {/* SCREEN 01: HOME */}
        {currentScreen === 'home' && (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col items-center">
            {/* Editorial Heading Section */}
            <div className="w-full text-center max-w-3xl mb-10 sm:mb-14">
              <div className="inline-block font-spec text-xs tracking-widest text-[#26352D] uppercase font-bold mb-3 border-b border-[#26352D]/20 pb-1">
                AI MATERIAL INTELLIGENCE
              </div>
              <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-[#222522] uppercase leading-[1.08] mb-4 text-balance">
                EVERY MATERIAL HAS A STORY.
              </h1>
              <p className="text-sm sm:text-lg text-[#222522]/80 max-w-xl mx-auto font-medium leading-relaxed">
                Identify, understand, and reimagine the materials around you. Built for industrial designers, architects, and circular thinkers.
              </p>
            </div>

            {/* Central Camera Capture Area */}
            <div className="w-full max-w-xl p-6 sm:p-10 bg-white/70 border border-[#26352D]/20 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              {/* Architectural corner crosshairs */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#26352D]/40" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[#26352D]/40" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#26352D]/40" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#26352D]/40" />

              {/* Shutter Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#26352D] text-[#F5F3ED] flex items-center justify-center mb-6 shadow-sm">
                <Camera className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-[#222522] mb-2">
                POINT YOUR CAMERA AT ANY OBJECT
              </h2>
              <p className="text-xs text-[#222522]/70 max-w-sm mb-8 leading-relaxed">
                Capture wood grain, anodized metal, polymers, textiles, or stone. Gemini vision models analyze texture and geometry to reveal material specs.
              </p>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartScan}
                  className="w-full sm:w-2/3 py-3.5 px-6 bg-[#26352D] hover:bg-[#1a251f] text-[#F5F3ED] text-xs sm:text-sm font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>SCAN MATERIAL →</span>
                </button>

                <button
                  onClick={() => fileInputHomeRef.current?.click()}
                  className="w-full sm:w-1/3 py-3.5 px-4 border border-[#26352D]/30 hover:border-[#26352D] bg-[#F5F3ED] text-[#222522] text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-[#26352D]" />
                  <span>UPLOAD</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputHomeRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                }}
                className="hidden"
                id="home-file-input"
              />
            </div>

            {/* Subtle 3-Step Process */}
            <div className="w-full max-w-3xl mt-12 sm:mt-16 pt-8 border-t border-[#26352D]/15">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <span className="font-spec text-xs font-bold text-[#26352D] mb-1">01 / CAPTURE</span>
                  <h3 className="text-sm font-bold text-[#222522] uppercase mb-1">PHOTOGRAPH THE SURFACE</h3>
                  <p className="text-xs text-[#222522]/70 leading-relaxed">
                    Capture high-detail imagery showing visible finish, fasteners, seams, or grain under natural lighting.
                  </p>
                </div>

                <div className="flex flex-col">
                  <span className="font-spec text-xs font-bold text-[#26352D] mb-1">02 / ANALYZE</span>
                  <h3 className="text-sm font-bold text-[#222522] uppercase mb-1">MULTIMODAL DECODING</h3>
                  <p className="text-xs text-[#222522]/70 leading-relaxed">
                    Gemini vision classifies substrate properties, manufacturing taxonomy, and municipal vs specialized recyclability.
                  </p>
                </div>

                <div className="flex flex-col">
                  <span className="font-spec text-xs font-bold text-[#26352D] mb-1">03 / REIMAGINE</span>
                  <h3 className="text-sm font-bold text-[#222522] uppercase mb-1">CIRCULAR REDESIGN</h3>
                  <p className="text-xs text-[#222522]/70 leading-relaxed">
                    Receive context-specific guidance for repair restoration, unblemished reuse, and closed-loop redesign.
                  </p>
                </div>
              </div>
            </div>

            {/* Full Specimen Archive & Previous Scans Section */}
            <HomeArchiveSection
              savedArchive={savedArchive}
              onSelectSpecimen={(specimen) => {
                setActiveAnalysis(specimen);
                setSelectedImageSrc(specimen.imageUrl || null);
                setCurrentScreen('results');
              }}
              onDeleteSpecimen={handleDeleteSpecimen}
              onClearArchive={handleClearArchive}
              onStartScan={handleStartScan}
            />
          </div>
        )}

        {/* SCREEN 02: LIVE CAMERA */}
        {currentScreen === 'camera' && (
          <CameraView
            onCapture={handleCapturePhoto}
            onCancel={handleGoHome}
            onUploadFile={handleUploadFile}
          />
        )}

        {/* SCREEN 02B: CAPTURE CONFIRMATION & PREVIEW */}
        {currentScreen === 'preview' && selectedImageSrc && (
          <ImagePreview
            imageSrc={selectedImageSrc}
            errorMessage={analysisError}
            onRetake={handleRetake}
            onConfirmAnalyze={handleExecuteAnalysis}
          />
        )}

        {/* SCREEN 03: ANALYZING WITH ROTATING MESSAGES */}
        {currentScreen === 'analyzing' && selectedImageSrc && (
          <AnalyzingView imageSrc={selectedImageSrc} />
        )}

        {/* SCREEN 04: FULL RESULTS SPEC SHEET */}
        {currentScreen === 'results' && activeAnalysis && (
          <ResultsView
            analysis={activeAnalysis}
            onScanAnother={handleStartScan}
            isSavedInArchive={isCurrentSaved}
            onToggleSaveArchive={handleToggleArchiveSave}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-[#26352D]/15 bg-[#F5F3ED] py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#222522]/60 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight text-[#222522]">MATTER.</span>
            <span>·</span>
            <span>Understand what things are made of.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-spec">
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-[#26352D] cursor-pointer">
              METHODOLOGY
            </button>
            <span>·</span>
            <button onClick={() => setIsArchiveOpen(true)} className="hover:text-[#26352D] cursor-pointer">
              SAVED SPECIMENS ({savedArchive.length})
            </button>
            <span>·</span>
            <span>GEMINI 3.8 FLASH</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SpecimenArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        savedAnalyses={savedArchive}
        onSelectSpecimen={(specimen) => {
          setActiveAnalysis(specimen);
          setSelectedImageSrc(specimen.imageUrl || null);
          setCurrentScreen('results');
          setIsArchiveOpen(false);
        }}
        onRemoveSpecimen={handleDeleteSpecimen}
        onClearArchive={handleClearArchive}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
