import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxKeyIntervalMs?: number;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxKeyIntervalMs = 35,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept scanner input when user is typing inside input or textarea unless it's a fast barcode scan
      const activeTag = document.activeElement?.tagName;
      const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      const currentTime = performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          if (isInputFocused) {
            // Prevent form submit if barcode scanner pressed Enter inside form
            e.preventDefault();
          }
          onScan(scannedCode);
        }
        bufferRef.current = '';
        return;
      }

      // Scanner keys are typed rapidly (< 35ms between characters)
      if (e.key.length === 1) {
        if (timeDiff > maxKeyIntervalMs && !isInputFocused) {
          // Reset buffer if delay between keystrokes was too long (manual human typing)
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minChars, maxKeyIntervalMs, enabled]);
}
