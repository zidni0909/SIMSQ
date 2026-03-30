'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Keyboard, X, ScanLine } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  placeholder?: string;
  label?: string;
}

export default function BarcodeScanner({ onScan, placeholder = 'Scan atau ketik kode...', label = 'Scan Barcode' }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    setError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Clean up any existing scanner
      await stopScanner();

      const scannerId = 'barcode-scanner-' + Date.now();
      containerRef.current.id = scannerId;

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
            return { width: Math.floor(size), height: Math.floor(size) };
          },
          aspectRatio: window.innerWidth < 640 ? 1.333 : 1,
        },
        (decodedText: string) => {
          const now = Date.now();
          // Prevent duplicate scans within 2 seconds
          if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2000) {
            return;
          }
          lastScanRef.current = decodedText;
          lastScanTimeRef.current = now;
          onScan(decodedText);
        },
        () => {
          // ignore scan failures (no code found in frame)
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      if (err?.message?.includes('Permission') || err?.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Mohon izinkan akses kamera di browser.');
      } else if (err?.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setError('Gagal membuka kamera: ' + (err?.message || 'Unknown error'));
      }
      setScanning(false);
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    if (mode === 'camera') {
      // Small delay to let the DOM render the container
      const timer = setTimeout(() => startScanner(), 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [mode, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) {
      onScan(code.trim());
      setCode('');
    }
  }

  return (
    <div className="border border-secondary-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-secondary-700">{label}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('camera')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 ${mode === 'camera' ? 'bg-primary-100 text-primary-700' : 'hover:bg-secondary-100 text-secondary-500'}`}
          >
            <Camera size={14} /> Kamera
          </button>
          <button
            onClick={() => { setMode('manual'); setTimeout(() => inputRef.current?.focus(), 100); }}
            className={`p-1.5 rounded text-xs flex items-center gap-1 ${mode === 'manual' ? 'bg-primary-100 text-primary-700' : 'hover:bg-secondary-100 text-secondary-500'}`}
          >
            <Keyboard size={14} /> Manual
          </button>
        </div>
      </div>

      {mode === 'camera' ? (
        <div>
          {error ? (
            <div className="text-center py-6 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
              <X size={32} className="mx-auto text-red-400 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={startScanner}
                className="mt-3 text-xs text-primary-600 hover:text-primary-700 underline"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={containerRef}
                className="rounded-lg overflow-hidden bg-black"
                style={{ minHeight: scanning ? undefined : '200px' }}
              />
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary-50 rounded-lg">
                  <ScanLine size={32} className="text-primary-400 animate-pulse mb-2" />
                  <p className="text-sm text-secondary-500">Membuka kamera...</p>
                </div>
              )}
              {scanning && (
                <p className="text-center text-xs text-secondary-500 mt-2">
                  Arahkan kamera ke barcode / QR code
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>
          <Button type="submit" size="sm">Cari</Button>
        </form>
      )}
    </div>
  );
}
