'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BrowserMultiFormatReader,
  BrowserCodeReader,
  type IScannerControls,
} from '@zxing/browser';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  ZapOff,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertCircle,
  ScanLine,
} from 'lucide-react';

export interface CameraBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  autoStart?: boolean;
  beepOnScan?: boolean;
  vibrateOnScan?: boolean;
  cooldownMs?: number;
  className?: string;
  title?: string;
  description?: string;
}

/**
 * High-performance WebRTC Camera Barcode Scanner component.
 * Uses @zxing/browser for continuous real-time video stream barcode decoding.
 * Supports start/stop controls, camera flipping, torch control, and POS audio/haptic feedback.
 */
export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  onScan,
  onError,
  onClose,
  autoStart = true,
  beepOnScan = true,
  vibrateOnScan = true,
  cooldownMs = 1500,
  className = '',
  title = 'Scan Jewellery Barcode',
  description = 'Point camera at Code-128 tag or ornament serial barcode',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const [isScanning, setIsScanning] = useState<boolean>(autoStart);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(beepOnScan);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanSuccessBanner, setScanSuccessBanner] = useState<boolean>(false);

  // Play crisp 1.8kHz POS confirmation beep using Web Audio API
  const playBeep = useCallback(() => {
    if (!audioFeedback) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio playback might be restricted if no user interaction yet
    }
  }, [audioFeedback]);

  // Trigger haptic vibration on mobile hardware
  const triggerVibrate = useCallback(() => {
    if (!vibrateOnScan) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {
      // Vibration not supported
    }
  }, [vibrateOnScan]);

  // Enumerate available video input devices
  useEffect(() => {
    async function loadDevices() {
      try {
        const videoDevices = await BrowserCodeReader.listVideoInputDevices();
        setDevices(videoDevices);

        if (videoDevices.length > 0) {
          // Default to environment/back camera if available
          const backCam = videoDevices.find((d) =>
            /back|rear|environment/i.test(d.label)
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      } catch (err: any) {
        // Device listing requires permission in some browsers
      }
    }
    loadDevices();
  }, []);

  // Stop scanner execution and release camera track stream
  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {
        // Ignored
      }
      controlsRef.current = null;
    }
    setIsScanning(false);
    setTorchEnabled(false);
    setHasTorch(false);
  }, []);

  // Start continuous barcode scanning loop
  const startScanner = useCallback(
    async (deviceIdToUse?: string) => {
      stopScanner();
      setErrorMessage(null);

      if (!videoRef.current) return;

      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const targetDeviceId = deviceIdToUse || selectedDeviceId || undefined;

        const controls = await reader.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const text = result.getText().trim();
              if (!text) return;

              const now = Date.now();
              const isSameCode = lastScanRef.current.code === text;
              const isWithinCooldown = now - lastScanRef.current.time < cooldownMs;

              if (isSameCode && isWithinCooldown) {
                return; // Prevent rapid duplicate scans
              }

              lastScanRef.current = { code: text, time: now };
              setLastScannedCode(text);
              setScanSuccessBanner(true);
              setTimeout(() => setScanSuccessBanner(false), 2000);

              playBeep();
              triggerVibrate();
              onScan(text);
            }

            if (error && error.name !== 'NotFoundException') {
              // NotFoundException is normal while searching frames
            }
          }
        );

        controlsRef.current = controls;
        setIsScanning(true);

        // Check torch capability
        try {
          const stream = videoRef.current.srcObject as MediaStream | null;
          const track = stream?.getVideoTracks()[0];
          if (track) {
            const capabilities: any = track.getCapabilities?.() || {};
            setHasTorch(Boolean(capabilities.torch));
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        stopScanner();
        const msg =
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in browser settings.'
            : err.name === 'NotFoundError'
            ? 'No video camera detected on this system.'
            : err.message || 'Failed to start camera scanner.';
        setErrorMessage(msg);
        if (onError) onError(err);
      }
    },
    [selectedDeviceId, cooldownMs, onScan, onError, playBeep, triggerVibrate, stopScanner]
  );

  // Manage scanner lifecycle on start/stop and device change
  useEffect(() => {
    if (isScanning && selectedDeviceId) {
      startScanner(selectedDeviceId);
    }
    return () => {
      stopScanner();
    };
  }, [selectedDeviceId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Toggle torch / flash on device
  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextState = !torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchEnabled(nextState);
      }
    } catch {
      // Torch apply failed
    }
  };

  // Switch between available cameras
  const cycleCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startScanner(nextDevice.deviceId);
  };

  return (
    <div
      className={`relative flex flex-col bg-slate-950/95 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl max-w-lg w-full mx-auto ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ScanLine size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
            <p className="text-[11px] text-slate-400 leading-tight">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mute / Unmute Beep */}
          <button
            type="button"
            onClick={() => setAudioFeedback(!audioFeedback)}
            title={audioFeedback ? 'Sound on' : 'Sound muted'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {audioFeedback ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-500" />}
          </button>

          {/* Close Scanner Modal */}
          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport & Scanning Viewfinder */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Viewfinder Target Reticle Overlay */}
        {isScanning && !errorMessage && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened vignette around scanning reticle */}
            <div className="relative w-3/4 h-3/5 border-2 border-amber-500/50 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex flex-col justify-between p-2 overflow-hidden">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>

              {/* Laser scanning beam line animation */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-bounce duration-1000"></div>

              <div className="text-center">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-amber-300/80 bg-black/60 px-2 py-0.5 rounded-full uppercase">
                  Align Barcode Inside Box
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Inactive or Stopped Overlay */}
        {!isScanning && !errorMessage && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <CameraOff size={36} className="text-slate-500" />
            <p className="text-xs text-slate-300">Camera preview is paused.</p>
            <button
              type="button"
              onClick={() => startScanner()}
              className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Camera size={14} /> Resume Camera Scan
            </button>
          </div>
        )}

        {/* Error Overlay */}
        {errorMessage && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-xs text-red-200 max-w-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={() => startScanner()}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Retry Camera
            </button>
          </div>
        )}

        {/* Detection Flash Feedback Banner */}
        {scanSuccessBanner && lastScannedCode && (
          <div className="absolute top-3 left-3 right-3 bg-emerald-500/90 text-white px-3 py-2 rounded-xl backdrop-blur-md flex items-center justify-between shadow-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-white" />
              <span className="text-xs font-mono font-bold tracking-wider">
                {lastScannedCode}
              </span>
            </div>
            <span className="text-[10px] uppercase font-semibold bg-black/30 px-2 py-0.5 rounded-full">
              Scanned
            </span>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-t border-white/[0.08] text-xs">
        {/* Toggle Scan (Start / Pause) */}
        <button
          type="button"
          onClick={() => (isScanning ? stopScanner() : startScanner())}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
            isScanning
              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
          }`}
        >
          {isScanning ? (
            <>
              <CameraOff size={14} /> Pause
            </>
          ) : (
            <>
              <Camera size={14} /> Start Scan
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Torch Toggle (if hardware supports torch) */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl transition-colors border ${
                torchEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
              }`}
              title="Toggle Flashlight / Torch"
            >
              {torchEnabled ? <Zap size={15} /> : <ZapOff size={15} />}
            </button>
          )}

          {/* Switch Camera */}
          {devices.length > 1 && (
            <button
              type="button"
              onClick={cycleCamera}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5"
              title="Switch Front/Back Camera"
            >
              <RefreshCw size={14} />
              <span className="text-[11px]">Flip Cam</span>
            </button>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 pl-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-400">
              {isScanning ? 'Live' : 'Off'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
