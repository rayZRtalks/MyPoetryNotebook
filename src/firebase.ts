import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

/**
 * Uploads a file or snapshot blob to Firebase Storage and returns the public download URL.
 * Bypasses to Cloudinary if Cloudinary is configured via LocalStorage or Vite Environment Variables.
 * Wraps upload request in a timeout to ensure quick fallback if client/Storage is slow or blocked.
 */
export async function uploadToStorage(id: string, blob: Blob | File): Promise<string> {
  let cloudName = '';
  let uploadPreset = '';
  let useCloudinary = false;

  try {
    const savedName = localStorage.getItem('poetry_notebook_cloudinary_cloud_name') || '';
    const savedPreset = localStorage.getItem('poetry_notebook_cloudinary_upload_preset') || '';
    const savedEnabled = localStorage.getItem('poetry_notebook_cloudinary_enabled') !== 'false'; // defaults to true if set
    
    // Fallback to env variables if local storage is blank
    cloudName = savedName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    uploadPreset = savedPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    
    // Explicitly enabled, or auto-enabled if details exist and not set to false
    useCloudinary = savedEnabled === true && !!cloudName && !!uploadPreset;
    
    // If enabled in localStorage initially or has env variables
    if (!localStorage.getItem('poetry_notebook_cloudinary_enabled') && cloudName && uploadPreset) {
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
      console.error('Cloudinary direct upload failed, falling back to Firebase Storage:', cloudinaryError);
    }
  }

  const timeoutMs = 8000; // 8 seconds timeout
  const uploadPromise = (async () => {
    const fileRef = ref(storage, `attachments/${id}`);
    await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(fileRef);
    return url;
  })();

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('Firebase Storage upload request timed out after 8s.')), timeoutMs)
  );

  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to upload file/snapshot to Firebase Storage:', error);
    throw error;
  }
}

export default app;
