import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  Camera,
  QrCode,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ZapOff,
  BookOpen,
  FileCheck,
  ArrowRight,
  Sparkles,
  Keyboard,
  Layers,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type { QRScanResult } from '../types/lms';

export interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollSuccess?: (subjectId: number) => void;
  onOpenAssignment?: (assignmentId: number, subjectId?: number) => void;
  onOpenSubject?: (subjectId: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface SampleQR {
  type: 'class_join' | 'assignment_submit';
  title: string;
  subtitle: string;
  code_payload: string;
  short_code: string;
  subject_id?: number;
  assignment_id?: number;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onEnrollSuccess,
  onOpenAssignment,
  onOpenSubject,
  showToast,
}) => {
  // Mode: 'camera' | 'upload' | 'manual' | 'samples'
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'samples'>('camera');
  
  // Camera state
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Video and stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isScanningRef = useRef(false);

  // Scanning status and results
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Manual code input
  const [manualCode, setManualCode] = useState('');

  // Sample QRs for testing & demo
  const [samples, setSamples] = useState<SampleQR[]>([]);
  const [sampleQRCache, setSampleQRCache] = useState<Record<string, string>>({});
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null);

  // Audio tone feedback using Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio not permitted or unsupported, ignore
    }
  }, [soundEnabled]);

  // Stop camera stream & scan loop
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Process decoded QR data via backend API
  const handleProcessQRData = useCallback(
    async (code: string) => {
      if (processing) return;
      setProcessing(true);
      stopCamera();

      // Haptic feedback if available
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(80);
        }
      } catch {
        // Ignore
      }

      playBeep();
      setLastScannedCode(code);

      try {
        const res = await apiRequest<QRScanResult>('/api/v1/student/qr-scan', {
          method: 'POST',
          body: JSON.stringify({ qr_data: code, auto_enroll: true }),
        });

        setScanResult(res);

        if (res.type === 'class_join') {
          if (res.enrolled && res.subject) {
            showToast(res.message, 'success');
            onEnrollSuccess?.(res.subject.id);
          } else if (res.already_enrolled) {
            showToast(res.message, 'info');
          }
        } else if (res.type === 'assignment_submit') {
          showToast(res.message, 'success');
        } else {
          showToast(res.message || 'QR code scanned.', 'info');
        }
      } catch (err: any) {
        setScanResult({
          type: 'unknown',
          raw_data: code,
          message: err?.message || 'Failed to process QR code. Please try again.',
          success: false,
        });
        showToast(err?.message || 'QR code recognition failed.', 'error');
      } finally {
        setProcessing(false);
      }
    },
    [processing, stopCamera, playBeep, showToast, onEnrollSuccess]
  );

  // Scan frame from video feed
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim()) {
          isScanningRef.current = false;
          handleProcessQRData(code.data.trim());
          return;
        }
      }
    }

    if (isScanningRef.current) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleProcessQRData]);

  // Start camera stream
  const startCamera = useCallback(
    async (facing: 'environment' | 'user') => {
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionState('unsupported');
        return;
      }

      setPermissionState('prompt');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setPermissionState('granted');
        setScanning(true);

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities?.() || {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            isScanningRef.current = true;
            animationFrameId.current = requestAnimationFrame(scanVideoFrame);
          };
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionState('denied');
        } else {
          // If environment camera failed (e.g. on laptop), fallback to user camera
          if (facing === 'environment') {
            setFacingMode('user');
            startCamera('user');
            return;
          }
          setPermissionState('denied');
        }
      }
    },
    [stopCamera, scanVideoFrame]
  );

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {
      showToast('Torch is not supported on this camera track.', 'info');
    }
  };

  // Flip camera between front & back
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Load sample QR codes for demo & testing
  const loadSamples = useCallback(async () => {
    try {
      const res = await apiRequest<{ samples: SampleQR[] }>('/api/v1/student/qr-samples');
      setSamples(res.samples || []);

      // Generate preview QR images for samples
      const cache: Record<string, string> = {};
      for (const s of res.samples || []) {
        try {
          const url = await QRCode.toDataURL(s.code_payload, {
            margin: 1,
            width: 220,
            color: { dark: '#047857', light: '#ffffff' },
          });
          cache[s.code_payload] = url;
        } catch {
          // Ignore
        }
      }
      setSampleQRCache(cache);
    } catch {
      // Fallback local samples
      const fallbackSamples: SampleQR[] = [
        {
          type: 'class_join',
          title: 'Join English 10 — Rizal STE',
          subtitle: 'Grade 10 · Rizal - STE · Prof. Jane Dela Cruz',
          code_payload: JSON.stringify({
            type: 'class_join',
            subject_id: 1,
            code: 'ENG10',
            name: 'English 10',
            school_year: '2026-2027',
          }),
          short_code: 'TNHS:JOIN:ENG10',
          subject_id: 1,
        },
        {
          type: 'class_join',
          title: 'Join Science 10 — STE Biology',
          subtitle: 'Grade 10 · Rizal - STE · Prof. Robert Santos',
          code_payload: JSON.stringify({
            type: 'class_join',
            subject_id: 2,
            code: 'SCI10',
            name: 'Science 10',
            school_year: '2026-2027',
          }),
          short_code: 'TNHS:JOIN:SCI10',
          subject_id: 2,
        },
        {
          type: 'assignment_submit',
          title: 'Submit: Argumentative Essay',
          subtitle: 'English 10 · Max 100 pts · Research & Defense',
          code_payload: JSON.stringify({
            type: 'assignment_submit',
            assignment_id: 1,
            code: 'ASG-1',
          }),
          short_code: 'TNHS:ASG:1',
          assignment_id: 1,
        },
      ];
      setSamples(fallbackSamples);
      const cache: Record<string, string> = {};
      for (const s of fallbackSamples) {
        try {
          const url = await QRCode.toDataURL(s.code_payload, {
            margin: 1,
            width: 220,
            color: { dark: '#047857', light: '#ffffff' },
          });
          cache[s.code_payload] = url;
        } catch {
          // Ignore
        }
      }
      setSampleQRCache(cache);
    }
  }, []);

  // Manage camera on modal open/close & tab change
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setLastScannedCode(null);
      if (activeTab === 'camera') {
        startCamera(facingMode);
      }
      loadSamples();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera, facingMode, loadSamples]);

  // Handle image file upload for QR code
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleProcessQRData(code.data.trim());
        } else {
          showToast('No QR code detected in the selected image. Please try a clearer photo.', 'error');
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      showToast('Please enter a class or assignment code.', 'error');
      return;
    }
    handleProcessQRData(manualCode.trim());
  };

  const copyPayload = (payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedPayload(payload);
    showToast('Code copied to clipboard!', 'info');
    setTimeout(() => setCopiedPayload(null), 2000);
  };

  const resetScanner = () => {
    setScanResult(null);
    setLastScannedCode(null);
    if (activeTab === 'camera') {
      startCamera(facingMode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                TNHS QR Code Scanner
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Join classes or scan assignment submission codes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute beep' : 'Enable beep sound'}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setScanResult(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Camera</span>
            <span className="sm:hidden">Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
              setScanResult(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
              setScanResult(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manual Code</span>
            <span className="sm:hidden">Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('samples');
              stopCamera();
              setScanResult(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'samples'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Samples</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* RESULT STATE OVERLAY / CARD */}
          {scanResult ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div
                className={`p-5 rounded-2xl border text-center space-y-3 ${
                  scanResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-950 dark:text-rose-100'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center border shadow-inner ${
                    scanResult.success
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-900/60 border-rose-500/50 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {scanResult.success ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/70 dark:bg-slate-900/70 border">
                    {scanResult.type === 'class_join'
                      ? 'Class Enrollment'
                      : scanResult.type === 'assignment_submit'
                      ? 'Assignment Submission'
                      : 'QR Code Result'}
                  </span>
                  <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                    {scanResult.message}
                  </h3>
                </div>

                {/* Subject Details Card */}
                {scanResult.subject && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {scanResult.subject.code}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {scanResult.subject.grade_level} · {scanResult.subject.section}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {scanResult.subject.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>Teacher: {scanResult.subject.teacher_name}</div>
                      <div>Room: {scanResult.subject.room || 'Homeroom'}</div>
                      <div>Schedule: {scanResult.subject.schedule}</div>
                      <div>Status: {scanResult.enrolled ? '🎉 Enrolled' : 'Active'}</div>
                    </div>
                  </div>
                )}

                {/* Assignment Details Card */}
                {scanResult.assignment && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {scanResult.assignment.subject_name}
                      </span>
                      <span className="font-mono text-amber-600">
                        Due {new Date(scanResult.assignment.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {scanResult.assignment.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {scanResult.assignment.description}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-slate-100 dark:border-slate-800">
                      <span>Max Score: {scanResult.assignment.max_score} pts</span>
                      <span>
                        {scanResult.submission
                          ? `Submitted (${scanResult.submission.status})`
                          : 'Pending Submission'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {scanResult.subject && onOpenSubject && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSubject(scanResult.subject!.id);
                      onClose();
                    }}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open Subject Modules</span>
                  </button>
                )}

                {scanResult.assignment && onOpenAssignment && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAssignment(scanResult.assignment!.id, scanResult.assignment!.subject_id);
                      onClose();
                    }}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>
                      {scanResult.submission ? 'View Submission' : 'Submit Assignment'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetScanner}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Another QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  Close Scanner
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* TAB 1: LIVE CAMERA SCANNER VIEW */
            <div className="space-y-4">
              {permissionState === 'denied' ? (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Camera Permission Denied or Unavailable
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Camera access was blocked. Please enable camera permission in your browser address bar,
                    or use the <strong>Upload</strong> or <strong>Manual Code</strong> tabs below.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera Permission</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      Upload Image Instead
                    </button>
                  </div>
                </div>
              ) : permissionState === 'unsupported' ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold">Camera is not supported on this browser device.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Upload QR Image File
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Camera Viewfinder Container */}
                  <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-xl flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Framing Box */}
                    <div className="relative z-10 w-[72%] h-[72%] border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                      {/* Corner Target Markers */}
                      <div className="flex justify-between">
                        <span className="w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                        <span className="w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      </div>

                      {/* Animated Laser Scanning Line */}
                      {scanning && (
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse" />
                      )}

                      <div className="flex justify-between">
                        <span className="w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                        <span className="w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                      </div>
                    </div>

                    {/* Scanning indicator badge */}
                    <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Align QR code inside box</span>
                      </span>
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          torchOn
                            ? 'bg-amber-500 border-amber-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {torchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        <span>{torchOn ? 'Flashlight Off' : 'Flashlight On'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Switch Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'upload' ? (
            /* TAB 2: UPLOAD IMAGE FOR QR */
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-center space-y-3 bg-slate-50 dark:bg-slate-950/60 hover:border-emerald-500 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Upload QR Code Screenshot or Photo
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports JPG, PNG, WebP images containing a class or assignment QR code
                  </p>
                </div>

                <label className="inline-block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                  <span className="min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Select Image File</span>
                  </span>
                </label>
              </div>
            </div>
          ) : activeTab === 'manual' ? (
            /* TAB 3: MANUAL CODE ENTRY */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Manual Code Entry Fallback
                </p>
                <p className="text-[11px] text-slate-500">
                  If your camera is unavailable, you can manually type a Subject Code (e.g. <code>ENG10</code>, <code>SCI10</code>), an Assignment Code (e.g. <code>ASG-1</code>), or paste raw QR payload.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="manual-qr-code" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Class or Assignment Code
                  </label>
                  <input
                    id="manual-qr-code"
                    type="text"
                    required
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. ENG10 or TNHS:JOIN:ENG10 or ASG-1"
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Verify and Process Code</span>
                </button>
              </form>
            </div>
          ) : (
            /* TAB 4: SAMPLE QR CODES FOR TESTING */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs space-y-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Scanner Without a Second Device</span>
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Click <strong>&quot;Simulate Scan&quot;</strong> on any card below to test immediate recognition, or point your phone camera at the QR code preview on another screen!
                </p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {samples.map((s, idx) => (
                  <div
                    key={`${s.type}-${idx}`}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 hover:border-emerald-500/50 transition-colors"
                  >
                    {/* Rendered QR thumbnail */}
                    {sampleQRCache[s.code_payload] ? (
                      <img
                        src={sampleQRCache[s.code_payload]}
                        alt={s.title}
                        className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <QrCode className="w-8 h-8 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            s.type === 'class_join'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                          }`}
                        >
                          {s.type === 'class_join' ? 'Class Join' : 'Assignment'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {s.short_code}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{s.subtitle}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleProcessQRData(s.code_payload)}
                          className="min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Simulate Scan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyPayload(s.short_code)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {copiedPayload === s.short_code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Camera Permission: {permissionState.toUpperCase()}</span>
          <span>DepEd Tudela NHS QR Standard</span>
        </div>
      </div>
    </div>
  );
};
