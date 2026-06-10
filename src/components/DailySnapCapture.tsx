import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, Check, RotateCcw, AlertCircle, Image as ImageIcon, Lock, Unlock } from 'lucide-react';
import { PoemAttachment, Poem } from '../types';
import { storeAttachmentBlob } from '../utils/attachmentDb';
import { uploadToStorage } from '../firebase';

interface DailySnapCaptureProps {
  onSave: (snapData: Omit<Poem, 'id' | 'createdAt'> & { createdAt?: string; isPrivate?: boolean }) => void;
  onCancel: () => void;
  appTheme?: 'dark' | 'light';
  editPoem?: Poem | null;
}

export default function DailySnapCapture({
  onSave,
  onCancel,
  appTheme = 'dark',
  editPoem = null,
}: DailySnapCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useCamera, setUseCamera] = useState<boolean>(!editPoem);
  const [capturedUrl, setCapturedUrl] = useState<string>(editPoem?.attachments?.[0]?.url || '');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>(editPoem?.body || '');
  const [isPrivate, setIsPrivate] = useState<boolean>(editPoem?.isPrivate || false);
  const [cameraError, setCameraError] = useState<string>('');
  const [showFlash, setShowFlash] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera stream
  useEffect(() => {
    if (useCamera && !capturedUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [useCamera, capturedUrl]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Webcam access was denied or is unavailable:', err);
      setCameraError('Webcam access is constrained. Switched to secure local file upload.');
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Camera flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Create a square crop centered
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;

      const sourceX = (video.videoWidth - size) / 2;
      const sourceY = (video.videoHeight - size) / 2;

      context.drawImage(
        video,
        sourceX,
        sourceY,
        size,
        size,
        0,
        0,
        size,
        size
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            setCapturedUrl(objectUrl);
            setCapturedBlob(blob);
            stopCamera();
          }
        },
        'image/jpeg',
        0.85
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCapturedUrl(objectUrl);
    setCapturedBlob(file);
  };

  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedUrl('');
    setCapturedBlob(null);
    setUseCamera(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBlob && !editPoem) return;

    let snapAttachment: PoemAttachment | undefined = editPoem?.attachments?.[0];

    if (capturedBlob) {
      const attachmentId = `attach-snap-${Date.now()}`;
      try {
        setIsUploading(true);
        // Store picture blob in IndexedDB
        await storeAttachmentBlob(attachmentId, capturedBlob);

        let cloudUrl = '';
        try {
          cloudUrl = await uploadToStorage(attachmentId, capturedBlob);
        } catch (err) {
          console.error('Failed to upload snap to Firebase Storage', err);
        }

        snapAttachment = {
          id: attachmentId,
          name: `Daily_Capture_${Date.now()}.jpg`,
          type: 'image',
          url: cloudUrl || capturedUrl,
        };
      } catch (err) {
        console.error('Failed to save snap to IndexedDB', err);
      } finally {
        setIsUploading(false);
      }
    }

    if (!snapAttachment) return;

    const formattedDate = editPoem
      ? new Date(editPoem.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

    onSave({
      title: editPoem ? editPoem.title : `Snapshot: ${formattedDate}`,
      body: caption.trim() || 'Spontaneous glimpse of the day.',
      categoryId: 'cat-snaps', // reserved ID for snapshots
      tags: ['snapshot', 'daily', 'photo-of-the-day'],
      mood: 'Reflective',
      attachments: [snapAttachment],
      isPhotoCapture: true,
      isPrivate,
      ...(editPoem ? { createdAt: editPoem.createdAt } : {}),
    });
  };

  return (
    <div className="space-y-6 text-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 border-neutral-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold font-display uppercase tracking-wider text-neutral-100">
            {editPoem ? 'Edit Daily Snapshot' : 'Inscribe Daily Picture Snapshot'}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-500 hover:text-white hover:bg-neutral-800 p-1.5 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Camera Live Feed / Upload Container */}
        <div className="relative aspect-square w-full max-w-[400px] mx-auto rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-inner flex flex-col items-center justify-center">
          {/* Flash Effect */}
          {showFlash && (
            <div className="absolute inset-0 bg-white z-50 animate-fade-out" />
          )}

          {capturedUrl ? (
            // Preview mode
            <img
              src={capturedUrl}
              alt="Snapshot daily pre-production"
              className="w-full h-full object-cover select-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : useCamera ? (
            // Live webcam feed
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />
              
              {/* Shutter capture trigger overlay wrapper */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-14 h-14 rounded-full border-4 border-white bg-cyan-500/80 hover:bg-cyan-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center p-1 shadow-lg hover:shadow-cyan-400/40"
                  title="Take Camera Photo"
                >
                  <Camera className="w-6 h-6 text-neutral-950 font-bold" />
                </button>
              </div>
            </div>
          ) : (
            // File upload fallback
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-200">No live camera feed</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-[240px] mx-auto">
                  Webcam stream was denied or is blocked. Select a picture file from your device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-bold rounded-lg cursor-pointer text-cyan-400 transition-colors"
              >
                Choose Local Image File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Hidden manual crop canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Option selectors: Camera vs File */}
        {!capturedUrl && (
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setUseCamera(true)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider font-mono uppercase border cursor-pointer transition-all ${
                useCamera
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              🎥 Live Webcam
            </button>
            <button
              type="button"
              onClick={() => {
                setUseCamera(false);
                setTimeout(() => fileInputRef.current?.click(), 50);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider font-mono uppercase border cursor-pointer transition-all ${
                !useCamera
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              📁 Browse Picture
            </button>
          </div>
        )}

        {/* Info or helper text */}
        {cameraError && !capturedUrl && (
          <div className="flex gap-2 items-start bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl text-neutral-300">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[11px] font-medium leading-relaxed">{cameraError}</span>
          </div>
        )}

        {/* Caption Field */}
        {capturedUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
                Capture Day Note / Caption:
              </label>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-cyan-400 font-bold transition-colors cursor-pointer uppercase font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replace Image</span>
              </button>
            </div>
            <textarea
              id="snap-caption-textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Captured snapshot brief story. What has made this day special?..."
              className="w-full h-20 bg-[#0c0d15] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed transition-all"
              required
            />
          </div>
        )}

        {/* Visibility Setting */}
        {capturedUrl && (
          <div id="snap-visibility-panel" className="p-4 bg-[#0c0d15] border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-300 tracking-wider uppercase font-mono flex items-center gap-1.5">
                {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-cyan-400" />}
                Visibility Setting
              </span>
              <p className="text-[10px] text-neutral-500 font-mono tracking-tight leading-relaxed">
                {isPrivate 
                  ? "Private: Invisible to the public, viewable only in Author Mode." 
                  : "Public: Visible to everyone visiting your notebook page."}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                id="snap-public-toggle"
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                  !isPrivate 
                    ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60 shadow-lg shadow-cyan-500/10' 
                    : 'bg-[#05060f] text-neutral-500 border-neutral-800/80 hover:text-neutral-300'
                }`}
              >
                Public
              </button>
              <button
                id="snap-private-toggle"
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                  isPrivate 
                    ? 'bg-amber-950/40 text-amber-500 border-amber-800/60 shadow-lg shadow-amber-500/10' 
                    : 'bg-[#05060f] text-neutral-500 border-neutral-800/80 hover:text-neutral-300'
                }`}
              >
                Private
              </button>
            </div>
          </div>
        )}

        {/* Action Triggers */}
        {capturedUrl && (
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-neutral-950 font-display uppercase tracking-widest text-xs font-extrabold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.99] text-center ${
              isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>Uploading Snapshot...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />
                <span>{editPoem ? 'Update Snapshot Details' : 'Publish Daily Snapshot'}</span>
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}
