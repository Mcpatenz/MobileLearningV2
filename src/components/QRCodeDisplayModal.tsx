import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  X,
  Download,
  Copy,
  Check,
  BookOpen,
  FileCheck,
  Sparkles,
  Share2,
} from 'lucide-react';

export interface QRCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  payload: string;
  type: 'class_join' | 'assignment_submit';
  codeLabel?: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  payload,
  type,
  codeLabel,
  showToast,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && payload) {
      QRCode.toDataURL(payload, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, payload]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeLabel || payload);
    setCopied(true);
    showToast('Code copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `TNHS-${type}-${(codeLabel || 'qr').replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR Code image downloaded successfully!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col text-center p-6 space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 pt-2">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              type === 'class_join'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20'
            }`}
          >
            {type === 'class_join' ? <BookOpen className="w-3.5 h-3.5" /> : <FileCheck className="w-3.5 h-3.5" />}
            <span>{type === 'class_join' ? 'Class Join Code' : 'Assignment Submission Code'}</span>
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        {/* QR Code Canvas Frame */}
        <div className="relative w-56 h-56 mx-auto bg-white rounded-2xl p-3 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Display Code */}
        {codeLabel && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span className="text-slate-500">Short Code:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{codeLabel}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-tight">
          Students can scan this code with their device camera in the MLA app to instantly join or submit.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
