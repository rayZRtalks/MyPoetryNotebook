import React, { useState, useEffect } from 'react';
import { X, Check, Cloud, Lock, HelpCircle, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CloudinarySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onEnableAuthorMode?: () => void;
}

export default function CloudinarySettingsModal({
  isOpen,
  onClose,
  onShowToast,
  onEnableAuthorMode,
}: CloudinarySettingsModalProps) {
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Load existing configuration from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem('poetry_notebook_cloudinary_cloud_name') || '';
      const savedPreset = localStorage.getItem('poetry_notebook_cloudinary_upload_preset') || '';
      const savedEnabled = localStorage.getItem('poetry_notebook_cloudinary_enabled') !== 'false'; // default to true if preset and name exist

      setCloudName(savedName);
      setUploadPreset(savedPreset);
      setIsEnabled(!!savedName && !!savedPreset && savedEnabled);
    }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCloudName = cloudName.trim();
    const trimmedUploadPreset = uploadPreset.trim();

    if (isEnabled && (!trimmedCloudName || !trimmedUploadPreset)) {
      onShowToast('Cloud Name and Upload Preset are required to enable Cloudinary.', 'error');
      return;
    }

    try {
      localStorage.setItem('poetry_notebook_cloudinary_cloud_name', trimmedCloudName);
      localStorage.setItem('poetry_notebook_cloudinary_upload_preset', trimmedUploadPreset);
      localStorage.setItem('poetry_notebook_cloudinary_enabled', String(isEnabled && !!trimmedCloudName && !!trimmedUploadPreset));

      if (isEnabled && trimmedCloudName && trimmedUploadPreset && onEnableAuthorMode) {
        onEnableAuthorMode();
      }

      onShowToast(
        isEnabled && trimmedCloudName && trimmedUploadPreset
          ? 'Cloudinary enabled and linked to Writer authorization!'
          : 'Cloudinary configuration updated.',
        'success'
      );
      onClose();
    } catch (err) {
      console.error('Error saving Cloudinary settings:', err);
      onShowToast('Could not save settings locally.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div id="modal-container-cloudinary" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        id="backdrop-cloudinary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm"
      />
      
      <motion.div
        id="sheet-cloudinary"
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 12, opacity: 0 }}
        className="bg-[#0c0d14] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 w-full max-w-lg space-y-6 text-neutral-200 overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-neutral-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <h3 id="cloudinary-title" className="text-lg font-display font-bold text-neutral-100 tracking-tight">
              Cloudinary Media Settings
            </h3>
          </div>
          <button
            id="btn-close-cloudinary"
            onClick={onClose}
            className="text-neutral-400 hover:text-white rounded-full p-1.5 hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Alert for Free Tier */}
        <div className="bg-cyan-950/20 border border-cyan-800/40 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            FREE & PUBLIC PERSISTENT CLOUD STORAGE
          </span>
          <p className="text-xs text-neutral-300 leading-relaxed">
            By integrating Cloudinary via <strong>Unsigned Uploads</strong>, you gain safe and persistent cloud media hosting. All pictures snapped or selected will be securely saved directly inside your Cloudinary account!
          </p>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Status Toggle */}
          <div className="p-4 bg-[#11121a] border border-neutral-800/80 rounded-xl flex items-center justify-between font-sans">
            <div className="space-y-0.5 text-left">
              <span className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                Storage Route Selection
              </span>
              <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                Select your media route. Cloudinary syncs publicly online.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEnabled(false)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                  !isEnabled
                    ? 'bg-neutral-900 text-neutral-200 border-neutral-700 shadow-lg'
                    : 'bg-[#05060f] text-neutral-500 border-neutral-800/80 hover:text-neutral-300'
                }`}
              >
                Local Browser
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEnabled(true);
                  if (!cloudName || !uploadPreset) {
                    setShowGuide(true);
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                  isEnabled
                    ? 'bg-cyan-950/50 text-cyan-400 border-cyan-800/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#05060f] text-neutral-500 border-neutral-800/80 hover:text-neutral-300'
                }`}
              >
                Cloudinary Vault ☁️
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Cloud Name Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Cloud Name
              </label>
              <input
                id="cloudinary-cloud-name-input"
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g., dej7k8mxl"
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
              />
            </div>

            {/* Upload Preset Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Unsigned Upload Preset
              </label>
              <input
                id="cloudinary-preset-input"
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                placeholder="e.g., poetry_preset"
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Guide / How To toggle */}
          <div className="pt-2 text-left">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-mono font-bold text-neutral-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>{showGuide ? 'Hide Setup Tutorial' : 'Show Setup Tutorial (Step-by-Step)'}</span>
            </button>

            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 bg-neutral-900/60 rounded-xl p-4.5 border border-neutral-850 text-xs text-neutral-300 space-y-3.5 select-text font-sans"
              >
                <p className="font-semibold text-neutral-200">How to establish your Free Cloudinary Storage:</p>
                
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">1.</span>
                    <p>Go to <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Cloudinary.com</a> and sign up for a completely free developer tier account.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">2.</span>
                    <p>Log in, go to your console, and locate your <strong className="text-neutral-100">Cloud Name</strong> (e.g., <code className="bg-neutral-950 px-1 py-0.5 rounded text-pink-400 font-semibold">dej7k8mxl</code>). Copy and paste it above.</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">3.</span>
                    <p>Click the <strong className="text-neutral-100">Settings</strong> (gear icon in the bottom-left of Cloudinary sidebar).</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">4.</span>
                    <p>Go to the <strong className="text-neutral-100">Upload</strong> settings tab on the top/side.</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">5.</span>
                    <p>Scroll down to <strong className="text-neutral-100">Upload presets</strong> and click <strong className="text-cyan-400 hover:underline">Add upload preset</strong>.</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">6.</span>
                    <p>Crucial: Set <strong className="text-neutral-100">Signing Mode</strong> to <strong className="text-amber-400">Unsigned</strong> (instead of Signed).</p>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">7.</span>
                    <p>Save the preset, copy the preset name (e.g., <code className="bg-neutral-950 px-1 py-0.5 rounded text-pink-400 font-semibold">pypx9l4m</code>), and copy-paste it above!</p>
                  </div>
                </div>

                <div className="flex gap-2 items-start bg-neutral-955 p-3 rounded-lg border border-neutral-800 text-[11px] text-neutral-400">
                  <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>These configurations are saved securely on YOUR device browser. The API endpoint does not leak any write secrets!</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit / Save Button */}
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4 mt-6">
            <button
              id="btn-cloudinary-modal-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full text-xs font-semibold transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              id="btn-cloudinary-modal-save"
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer font-sans"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Config</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
