'use client';

import { useEffect, useRef } from 'react';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxIntervalMs?: number; // Keystroke interval threshold (default: 35ms)
  minLength?: number;     // Minimum length of valid scanned barcode (default: 4)
  preventDefault?: boolean; // Prevent default Enter action
  enabled?: boolean;
}

/**
 * Universal Hardware Keyboard Wedge Barcode Scanner Listener.
 * Commercial USB and Bluetooth barcode scanners mimic ultra-fast keyboard typing (<35ms per keystroke)
 * followed by an Enter key.
 */
export function useBarcodeScanner({
  onScan,
  maxIntervalMs = 35,
  minLength = 4,
  preventDefault = true,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      // If user is intentionally typing in a textarea or text input that isn't a dedicated scan bar,
      // allow scanner input only if the burst timing indicates hardware input (<35ms).
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const currentTime = performance.now();
      const interval = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Enter key marks end of barcode burst
      if (event.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedCode.length >= minLength) {
          if (preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }
          onScan(scannedCode);
        }
        return;
      }

      // If interval between keystrokes exceeds maxIntervalMs, reset buffer (it's manual human typing)
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        // If not in input, we keep whatever burst started, else clear
        if (isInput) {
          bufferRef.current = '';
        }
      }

      // Only accumulate printable single characters
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        bufferRef.current += event.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, maxIntervalMs, minLength, preventDefault, enabled]);
}
