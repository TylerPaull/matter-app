/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Upload, AlertCircle, Zap, ZapOff, ArrowLeft } from 'lucide-react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
  onUploadFile: (file: File) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel, onUploadFile }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(true);

  // Stop active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsLoadingCamera(true);
    setErrorMessage(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage(
        'Live camera access is not supported by this browser. You can still use the native photo capture or upload an existing image below.'
      );
      setIsLoadingCamera(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setHasPermission(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera access was denied by your browser settings. Please allow camera permissions in your browser URL bar, or tap "Upload / Choose Photo" to use your device camera directly.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device detected on this system. You can upload or select an existing photo.');
      } else {
        setErrorMessage(
          `Unable to access camera (${err.message || 'Unknown error'}). Use the upload button below to select an image.`
        );
      }
    } finally {
      setIsLoadingCamera(false);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopStream();
    };
  }, [facingMode, startCamera, stopStream]);

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const newTorchState = !torchActive;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorchState }],
        });
        setTorchActive(newTorchState);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Flip between environment (rear) and user (front)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture current frame from video element
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front-facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopStream();
    onCapture(dataUrl);
  };

  // Handle file input selection (fallback or deliberate upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopStream();
      onUploadFile(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Top Bar Navigation */}
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <button
          onClick={() => {
            stopStream();
            onCancel();
          }}
          className="flex items-center gap-1.5 text-[#222522] hover:text-[#26352D] font-semibold uppercase tracking-wider py-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <span className="font-spec text-[11px] text-[#26352D] font-bold tracking-widest uppercase">
          VIEWFINDER / {facingMode.toUpperCase()}
        </span>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-[#26352D] hover:underline font-semibold uppercase tracking-wider cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>FILE</span>
        </button>
      </div>

      {/* Main Viewfinder Frame */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#1a201c] overflow-hidden border border-[#26352D]/30 shadow-lg flex items-center justify-center">
        {/* Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoadingCamera || hasPermission === false ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Viewfinder Architectural Reticle Overlay */}
        {hasPermission && !isLoadingCamera && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
            {/* Corner brackets */}
            <div className="flex justify-between items-start">
              <div className="w-6 h-6 border-t-2 border-l-2 border-[#F5F3ED]/70" />
              <div className="w-6 h-6 border-t-2 border-r-2 border-[#F5F3ED]/70" />
            </div>

            {/* Center target crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-70">
              <div className="w-full h-[1px] bg-[#F5F3ED]/60" />
              <div className="h-full w-[1px] bg-[#F5F3ED]/60 absolute" />
              <div className="w-3 h-3 border border-[#F5F3ED] rounded-none absolute" />
            </div>

            {/* Bottom brackets & metadata */}
            <div className="flex justify-between items-end">
              <div className="w-6 h-6 border-b-2 border-l-2 border-[#F5F3ED]/70" />
              <div className="font-spec text-[10px] text-[#F5F3ED]/90 tracking-widest uppercase bg-[#26352D]/80 px-2 py-0.5">
                FRAME SPECIMEN SURFACE
              </div>
              <div className="w-6 h-6 border-b-2 border-r-2 border-[#F5F3ED]/70" />
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoadingCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1a201c] text-[#F5F3ED] z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-[#8A9A86]" />
            <p className="font-spec text-xs tracking-wider text-[#D8D4C7]">INITIALIZING HARDWARE CAMERA...</p>
          </div>
        )}

        {/* Permission Denied or Unsupported Error Overlay */}
        {!isLoadingCamera && hasPermission === false && (
          <div className="absolute inset-0 bg-[#26352D]/95 text-[#F5F3ED] p-6 flex flex-col items-center justify-center text-center z-20">
            <AlertCircle className="w-10 h-10 text-[#D8D4C7] mb-3" />
            <h3 className="text-base font-bold tracking-tight uppercase mb-2">Camera Access Restricted</h3>
            <p className="text-xs text-[#F5F3ED]/80 max-w-md mb-6 leading-relaxed">
              {errorMessage || 'Browser camera permissions are required to scan live material surfaces.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-[#F5F3ED] hover:bg-white text-[#26352D] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload / Take Photo</span>
              </button>
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full py-2.5 px-4 border border-[#F5F3ED]/40 hover:border-[#F5F3ED] text-[#F5F3ED] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Native Camera / Gallery Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-fallback-input"
      />

      {/* Camera Controls Toolbar */}
      <div className="w-full mt-5 flex items-center justify-between max-w-md px-2">
        {/* Left: Torch Toggle */}
        <div className="w-16 flex justify-start">
          {hasTorch ? (
            <button
              onClick={toggleTorch}
              className={`p-3 rounded-full border transition-colors cursor-pointer ${
                torchActive
                  ? 'bg-[#F5F3ED] text-[#26352D] border-[#26352D]'
                  : 'bg-white/80 text-[#222522] border-[#26352D]/20 hover:bg-white'
              }`}
              aria-label={torchActive ? 'Turn off flashlight' : 'Turn on flashlight'}
            >
              {torchActive ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
          ) : (
            <div className="w-11" />
          )}
        </div>

        {/* Center: Prominent Architectural Shutter Capture Button */}
        <button
          onClick={handleCaptureFrame}
          disabled={!hasPermission || isLoadingCamera}
          className="relative group p-1 rounded-full border-2 border-[#26352D] bg-[#F5F3ED] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform active:scale-95"
          aria-label="Capture photograph of material"
        >
          <div className="w-16 h-16 rounded-full bg-[#26352D] group-hover:bg-[#1a251f] flex items-center justify-center text-[#F5F3ED] transition-colors shadow-md">
            <Camera className="w-7 h-7" />
          </div>
        </button>

        {/* Right: Camera Flip Toggle */}
        <div className="w-16 flex justify-end">
          <button
            onClick={toggleFacingMode}
            disabled={!hasPermission || isLoadingCamera}
            className="p-3 rounded-full bg-white/80 hover:bg-white text-[#222522] border border-[#26352D]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Switch front or back camera"
          >
            <RefreshCw className="w-5 h-5 text-[#26352D]" />
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="mt-4 text-center">
        <p className="text-[11px] text-[#222522]/60 font-spec uppercase tracking-wider">
          TIPS: CAPTURE SURFACE TEXTURE UNDER BALANCED NATURAL LIGHTING
        </p>
      </div>
    </div>
  );
};
