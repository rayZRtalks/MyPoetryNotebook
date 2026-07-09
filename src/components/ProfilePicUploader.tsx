import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Loader2, User, Sliders, Check, X, RefreshCw, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToStorage, compressImage } from '../cloudinary';
import { safeLocalStorage } from '../utils/safeStorage';

interface ProfilePicUploaderProps {
  profilePic: string;
  profilePicPosition: { scale: number; x: number; y: number };
  onProfileChange: (url: string, pos: { scale: number; x: number; y: number }) => void;
  appTheme: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid';
  sizeClass?: string;
  isAuthorMode?: boolean;
}

export default function ProfilePicUploader({
  profilePic,
  profilePicPosition,
  onProfileChange,
  appTheme,
  sizeClass = 'w-10 h-10 md:w-11 md:h-11',
  isAuthorMode = false,
}: ProfilePicUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal position states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [position, setPosition] = useState<{ scale: number; x: number; y: number }>(profilePicPosition || { scale: 1, x: 0, y: 0 });

  // Synchronize with external profile positions fetched from server
  useEffect(() => {
    if (profilePicPosition) {
      setPosition(profilePicPosition);
    }
  }, [profilePicPosition]);

  const [tempPosition, setTempPosition] = useState<{ scale: number; x: number; y: number }>({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize initial modal opening with current saved position
  useEffect(() => {
    if (showAdjustModal) {
      setTempPosition({ ...position });
    }
  }, [showAdjustModal, position]);

  // Handle window drag movements for seamless off-container tracking
  useEffect(() => {
    if (!showAdjustModal) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const container = dragContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerSize = rect.width || 192;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      const percentageChangeX = (dx / containerSize) * 100;
      const percentageChangeY = (dy / containerSize) * 100;

      // Restrict offset bound to prevent image from escaping completely out of context
      const maxOffset = (tempPosition.scale - 1) * 50 + 25;
      const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartOffset.current.x + percentageChangeX));
      const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartOffset.current.y + percentageChangeY));

      setTempPosition(prev => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    };

    const handleWindowMouseUp = () => {
      isDragging.current = false;
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length === 0) return;
      const container = dragContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerSize = rect.width || 192;

      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;

      const percentageChangeX = (dx / containerSize) * 100;
      const percentageChangeY = (dy / containerSize) * 100;

      const maxOffset = (tempPosition.scale - 1) * 50 + 25;
      const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartOffset.current.x + percentageChangeX));
      const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartOffset.current.y + percentageChangeY));

      setTempPosition(prev => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    };

    const handleWindowTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [showAdjustModal, tempPosition.scale]);

  const savePosition = (newPos: { scale: number; x: number; y: number }) => {
    setPosition(newPos);
    try {
      safeLocalStorage.setItem('poetry_notebook_profile_pic_position', JSON.stringify(newPos));
    } catch (e) {
      console.error('[ProfilePic] Failed to save position:', e);
    }
  };

  // Styling based on active app theme to integrate with the header's design
  const getThemeStyles = () => {
    switch (appTheme) {
      case 'light':
        return {
          border: 'border-[#E2D9CF]',
          bg: 'bg-[#faf6f0]',
          text: 'text-[#2E2A27]',
          accent: 'text-[#C97F65]',
          accentBg: 'bg-[#C97F65]',
          ring: 'focus-within:ring-[#C97F65]/50 hover:border-[#C97F65]/80',
          trashBg: 'bg-[#C97F65] hover:bg-[#b06f56]',
        };
      case 'sankofa':
        return {
          border: 'border-[#bf3f27]/30',
          bg: 'bg-[#f3cc3c]',
          text: 'text-[#3a1a14]',
          accent: 'text-[#bf3f27]',
          accentBg: 'bg-[#bf3f27]',
          ring: 'focus-within:ring-[#bf3f27]/50 hover:border-[#bf3f27]/80',
          trashBg: 'bg-[#bf3f27] hover:bg-[#a1341f]',
        };
      case 'momoamo':
        return {
          border: 'border-[#FAF6F0]/20',
          bg: 'bg-[#142217]',
          text: 'text-[#FAF6F0]',
          accent: 'text-[#E1FE35]',
          accentBg: 'bg-[#E1FE35]',
          ring: 'focus-within:ring-[#E1FE35]/50 hover:border-[#E1FE35]/80',
          trashBg: 'bg-[#E1FE35] hover:bg-[#cbf42d] text-black',
        };
      case 'madrid':
        return {
          border: 'border-black/15',
          bg: 'bg-[#FDA172]',
          text: 'text-[#0E0E15]',
          accent: 'text-black',
          accentBg: 'bg-black',
          ring: 'focus-within:ring-black/50 hover:border-black/80',
          trashBg: 'bg-black hover:bg-neutral-800 text-white',
        };
      default: // dark
        return {
          border: 'border-neutral-800',
          bg: 'bg-neutral-900',
          text: 'text-neutral-200',
          accent: 'text-cyan-400',
          accentBg: 'bg-cyan-500',
          ring: 'focus-within:ring-cyan-400/50 hover:border-cyan-400/80',
          trashBg: 'bg-cyan-600 hover:bg-cyan-700',
        };
    }
  };

  const styles = getThemeStyles();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setError(null);

    try {
      // 1. Compress image to a clean circular profile thumbnail size (200x200 px)
      const compressed = await compressImage(file, 200, 200, 0.7);

      // 2. Upload to storage (either Cloudinary or fallback local server directory)
      let uploadedUrl = '';
      try {
        uploadedUrl = await uploadToStorage('profile-pic', compressed);
      } catch (uploadErr) {
        console.warn('[ProfilePic] Cloud/Server upload failed, storing directly in LocalStorage as Base64:', uploadErr);
        // Direct base64 fallback to ensure offline/local usability
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image data'));
          reader.readAsDataURL(compressed);
        });
      }

      // 3. Callback update
      onProfileChange(uploadedUrl, { scale: 1, x: 0, y: 0 });
      
      // 4. Automatically open positioning modal so they can frame the new image immediately!
      setShowAdjustModal(true);
    } catch (err: any) {
      console.error('[Profile Upload] Error processing picture:', err);
      setError(err?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProfileChange('', { scale: 1, x: 0, y: 0 });
  };

  const handleDragStartLocal = (clientX: number, clientY: number) => {
    isDragging.current = true;
    dragStart.current = { x: clientX, y: clientY };
    dragStartOffset.current = { x: tempPosition.x, y: tempPosition.y };
  };

  const handleZoomSliderChange = (newScale: number) => {
    // Dynamically constrain current positions as zoom is reduced
    const maxOffset = (newScale - 1) * 50 + 25;
    const boundedX = Math.max(-maxOffset, Math.min(maxOffset, tempPosition.x));
    const boundedY = Math.max(-maxOffset, Math.min(maxOffset, tempPosition.y));
    setTempPosition({
      scale: newScale,
      x: boundedX,
      y: boundedY,
    });
  };

  // Modal custom design themes
  const getModalThemeStyles = () => {
    switch (appTheme) {
      case 'light':
        return {
          bg: 'bg-[#faf6f0]',
          border: 'border-[#E2D9CF]',
          text: 'text-[#2E2A27]',
          subtext: 'text-[#2E2A27]/70',
          circleBorder: 'border-[#C97F65]',
          accentBg: 'bg-[#C97F65]',
          accentText: 'text-white',
          accentHover: 'hover:bg-[#b06f56]',
          cancelBg: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800',
          sliderThumb: 'accent-[#C97F65]',
        };
      case 'sankofa':
        return {
          bg: 'bg-[#fffdf9]',
          border: 'border-[#bf3f27]/30',
          text: 'text-[#3a1a14]',
          subtext: 'text-[#3a1a14]/70',
          circleBorder: 'border-[#bf3f27]',
          accentBg: 'bg-[#bf3f27]',
          accentText: 'text-[#fffdf9]',
          accentHover: 'hover:bg-[#a1341f]',
          cancelBg: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800',
          sliderThumb: 'accent-[#bf3f27]',
        };
      case 'momoamo':
        return {
          bg: 'bg-[#142217]',
          border: 'border-[#FAF6F0]/20',
          text: 'text-[#FAF6F0]',
          subtext: 'text-[#FAF6F0]/70',
          circleBorder: 'border-[#E1FE35]',
          accentBg: 'bg-[#E1FE35] text-black',
          accentText: 'text-black',
          accentHover: 'hover:bg-[#cbf42d]',
          cancelBg: 'bg-white/10 hover:bg-white/20 text-[#FAF6F0]',
          sliderThumb: 'accent-[#E1FE35]',
        };
      case 'madrid':
        return {
          bg: 'bg-[#0E0E15]',
          border: 'border-white/10',
          text: 'text-white',
          subtext: 'text-white/70',
          circleBorder: 'border-[#FDA172]',
          accentBg: 'bg-[#FDA172] text-black',
          accentText: 'text-black',
          accentHover: 'hover:bg-[#e08a5c]',
          cancelBg: 'bg-white/10 hover:bg-white/20 text-white',
          sliderThumb: 'accent-[#FDA172]',
        };
      default: // dark
        return {
          bg: 'bg-neutral-900',
          border: 'border-neutral-800',
          text: 'text-neutral-100',
          subtext: 'text-neutral-400',
          circleBorder: 'border-cyan-500',
          accentBg: 'bg-cyan-600 text-white',
          accentText: 'text-white',
          accentHover: 'hover:bg-cyan-700',
          cancelBg: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300',
          sliderThumb: 'accent-cyan-400',
        };
    }
  };

  const modalStyles = getModalThemeStyles();

  return (
    <>
      <div 
        id="profile-pic-uploader-container" 
        className="relative select-none flex items-center"
        onContextMenu={(e) => {
          if (!isAuthorMode) {
            e.preventDefault();
          }
        }}
      >
        <div 
          onClick={() => {
            if (isAuthorMode && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative ${isAuthorMode ? 'group cursor-pointer' : 'cursor-default'} ${sizeClass} rounded-full border-2 ${styles.border} ${styles.bg} ${isAuthorMode ? styles.ring : ''} transition-all duration-300 overflow-hidden flex items-center justify-center shadow-md`}
          title={isAuthorMode ? "Upload your profile picture" : "Author Profile"}
        >
          {isUploading ? (
            <Loader2 className={`w-4 h-4 animate-spin ${styles.accent}`} />
          ) : profilePic ? (
            <>
              <img 
                src={profilePic} 
                alt="Profile" 
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  transform: `translate(${position.x}%, ${position.y}%) scale(${position.scale})`,
                  transformOrigin: 'center center',
                }}
              />
              {/* Protective Overlay in public mode to block standard image interactions like dragging or right-clicking to save */}
              {!isAuthorMode && (
                <div 
                  className="absolute inset-0 bg-transparent z-10 cursor-default select-none pointer-events-auto"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
              {/* Quick action overlay - only in author mode */}
              {isAuthorMode && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </>
          ) : (
            <>
              <User className={`w-4 h-4 ${styles.text} opacity-60`} />
              {isAuthorMode && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </>
          )}

          {isAuthorMode && (
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          )}
        </div>

        {isAuthorMode && profilePic && !isUploading && (
          <div className="absolute -top-1 -right-1 flex gap-1 z-20">
            {/* Position / crop button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAdjustModal(true);
              }}
              className={`p-1 rounded-full text-white shadow-md transition-all duration-200 hover:scale-110 ${styles.trashBg}`}
              title="Adjust position & zoom"
            >
              <Sliders className="w-2.5 h-2.5" />
            </button>
            
            {/* Delete button */}
            <button
              onClick={handleRemove}
              className={`p-1 rounded-full text-white shadow-md transition-all duration-200 hover:scale-110 ${styles.trashBg}`}
              title="Remove profile picture"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {error && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-red-950/95 text-red-200 text-[10px] py-1 px-2.5 rounded-lg shadow-lg border border-red-500/50 max-w-[180px] z-50 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Polish Repositioning Modal with Touch & Drag Capabilities */}
      <AnimatePresence>
        {showAdjustModal && profilePic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blurred dark backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAdjustModal(false)}
            />

            {/* Modal Card content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-sm rounded-2xl border ${modalStyles.border} ${modalStyles.bg} p-6 shadow-2xl z-10 flex flex-col items-center`}
            >
              <button 
                onClick={() => setShowAdjustModal(false)}
                className={`absolute top-4 right-4 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity ${modalStyles.text}`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-5">
                <h3 className={`text-base font-bold tracking-tight ${modalStyles.text} mb-1 flex items-center justify-center gap-2`}>
                  <Move className="w-4 h-4 opacity-70" /> Center Profile Picture
                </h3>
                <p className={`text-[11px] leading-relaxed ${modalStyles.subtext}`}>
                  Drag the image inside the circle to pan. Use the slider below to zoom.
                </p>
              </div>

              {/* Responsive interactive circular viewport */}
              <div 
                ref={dragContainerRef}
                className={`relative w-44 h-44 rounded-full border-4 ${modalStyles.circleBorder} overflow-hidden cursor-move shadow-inner select-none bg-black/10`}
                onMouseDown={(e) => handleDragStartLocal(e.clientX, e.clientY)}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    handleDragStartLocal(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
              >
                <img 
                  src={profilePic}
                  alt="Position Preview"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  style={{
                    transform: `translate(${tempPosition.x}%, ${tempPosition.y}%) scale(${tempPosition.scale})`,
                    transformOrigin: 'center center',
                  }}
                />
                
                {/* Visual drag guides */}
                <div className="absolute inset-0 border border-white/10 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="w-1/2 h-1/2 border border-dashed border-white/20 rounded-full" />
                </div>
              </div>

              {/* Slider for Zoom */}
              <div className="w-full space-y-2 mb-6">
                <div className="flex justify-between items-center text-[11px] font-mono opacity-80 px-1">
                  <span className={modalStyles.text}>Zoom</span>
                  <span className={modalStyles.text}>{Math.round(tempPosition.scale * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${modalStyles.text}`}>1x</span>
                  <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={tempPosition.scale}
                    onChange={(e) => handleZoomSliderChange(parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-neutral-300 dark:bg-neutral-800 ${modalStyles.sliderThumb}`}
                  />
                  <span className={`text-[10px] ${modalStyles.text}`}>3x</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setTempPosition({ scale: 1, x: 0, y: 0 })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors ${modalStyles.cancelBg}`}
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${modalStyles.cancelBg}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onProfileChange(profilePic, tempPosition);
                    setShowAdjustModal(false);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold shadow transition-all duration-200 active:scale-95 ${modalStyles.accentBg} ${modalStyles.accentText} ${modalStyles.accentHover}`}
                >
                  <Check className="w-3.5 h-3.5" /> Save Fit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
