/**
 * Cloudinary Integration & Media Utilities
 * Completely replaces the legacy Firebase media utilities.
 */

import { safeLocalStorage } from './utils/safeStorage';

/**
 * Uploads an image or video to Cloudinary using Unsigned Upload presets.
 */
export async function uploadToCloudinary(blob: Blob | File, cloudName: string, uploadPreset: string): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data = await response.json();
  return data.secure_url || data.url;
}

function blobToBase64(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadToBackend(id: string, blob: Blob | File): Promise<string> {
  const filename = (blob as File).name || `snap-${id}.jpg`;
  const base64 = await blobToBase64(blob);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      data: base64,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server responded with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.url) {
    throw new Error('No URL returned from backend upload API');
  }
  return result.url;
}

/**
 * Uploads a file or snapshot blob directly to Cloudinary.
 * Bypasses to a robust local backend disk upload if Cloudinary is not configured,
 * ensuring zero dependencies on any Firebase Storage infrastructure.
 */
export async function uploadToStorage(id: string, blob: Blob | File): Promise<string> {
  let cloudName = '';
  let uploadPreset = '';
  let useCloudinary = false;

  try {
    const savedName = safeLocalStorage.getItem('poetry_notebook_cloudinary_cloud_name') || '';
    const savedPreset = safeLocalStorage.getItem('poetry_notebook_cloudinary_upload_preset') || '';
    const savedEnabled = safeLocalStorage.getItem('poetry_notebook_cloudinary_enabled') !== 'false'; // defaults to true if set
    
    // Fallback to env variables if local storage is blank
    cloudName = savedName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    uploadPreset = savedPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    
    // Explicitly enabled, or auto-enabled if details exist and not set to false
    useCloudinary = savedEnabled === true && !!cloudName && !!uploadPreset;
    
    // If enabled in localStorage initially or has env variables
    if (!safeLocalStorage.getItem('poetry_notebook_cloudinary_enabled') && cloudName && uploadPreset) {
      useCloudinary = true;
    }
  } catch (err) {
    console.warn('LocalStorage reads are blocked or unavailable:', err);
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    useCloudinary = !!cloudName && !!uploadPreset;
  }

  if (useCloudinary && cloudName && uploadPreset) {
    try {
      console.log('Routing file upload to Cloudinary (unsigned preset):', { cloudName, uploadPreset });
      return await uploadToCloudinary(blob, cloudName, uploadPreset);
    } catch (cloudinaryError) {
      console.error('Cloudinary direct upload failed, returning local Base64 fallback:', cloudinaryError);
    }
  }

  // Local fallback: upload to backend local disk database for multi-session persistence
  try {
    console.info('Uploading file to backend disk database for persistent URL access...');
    return await uploadToBackend(id, blob);
  } catch (backendError) {
    console.error('Failed to upload to backend, falling back to client-side Base64 string:', backendError);
    try {
      return await blobToBase64(blob);
    } catch (error) {
      console.error('Failed to encode image to Base64 data:', error);
      return URL.createObjectURL(blob);
    }
  }
}
