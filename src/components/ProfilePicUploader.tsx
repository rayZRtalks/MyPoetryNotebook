import React, { useState, useRef } from 'react';
import { Camera, Trash2, Loader2, User } from 'lucide-react';
import { uploadToStorage, compressImage } from '../cloudinary';
import { safeLocalStorage } from '../utils/safeStorage';

interface ProfilePicUploaderProps {
  profilePic: string;
  onProfilePicChange: (url: string) => void;
  appTheme: 'dark' | 'light' | 'sankofa' | 'momoamo' | 'madrid';
  sizeClass?: string;
  isAuthorMode?: boolean;
}

export default function ProfilePicUploader({
  profilePic,
  onProfilePicChange,
  appTheme,
  sizeClass = 'w-10 h-10 md:w-11 md:h-11',
  isAuthorMode = false,
}: ProfilePicUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onProfilePicChange(uploadedUrl);
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
    onProfilePicChange('');
  };

  return (
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
        <button
          onClick={handleRemove}
          className={`absolute -top-1 -right-1 p-0.5 rounded-full text-white shadow-md transition-all duration-200 hover:scale-110 ${styles.trashBg} z-20`}
          title="Remove profile picture"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}

      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-red-950/95 text-red-200 text-[10px] py-1 px-2.5 rounded-lg shadow-lg border border-red-500/50 max-w-[180px] z-50 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
