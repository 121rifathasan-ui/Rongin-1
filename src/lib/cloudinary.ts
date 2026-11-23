/**
 * Cloudinary Upload Helper
 * Cloud Name: glj9uvvm
 * Upload Presets: shora shori shongbad, ml_default
 * API Key: 278477884168823
 */

const envCloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'glj9uvvm';
const envPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'shora shori shongbad';
const envApiKey = (import.meta as any).env?.VITE_CLOUDINARY_API_KEY || '278477884168823';

export const CLOUDINARY_CONFIG = {
  cloudName: envCloudName.trim(),
  primaryPreset: envPreset.trim(),
  fallbackPreset: 'ml_default',
  apiKey: envApiKey.trim(),
  get videoUploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;
  },
  get imageUploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  },
  get autoUploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
  },
};

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  duration?: number;
  format?: string;
  bytes?: number;
  thumbnailUrl?: string;
}

/**
 * Uploads a video or image file to Cloudinary with progress callback
 */
export async function uploadFileToCloudinary(
  file: File | Blob,
  resourceType: 'video' | 'image' | 'auto' = 'auto',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const tryUpload = (preset: string): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
      const url =
        resourceType === 'video'
          ? CLOUDINARY_CONFIG.videoUploadUrl
          : resourceType === 'image'
          ? CLOUDINARY_CONFIG.imageUploadUrl
          : CLOUDINARY_CONFIG.autoUploadUrl;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      if (CLOUDINARY_CONFIG.apiKey) {
        formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            const secureUrl = res.secure_url || res.url;
            const publicId = res.public_id;
            const duration = res.duration;
            const format = res.format;
            const bytes = res.bytes;

            // Generate poster thumbnail for video
            let thumbnailUrl = '';
            if (resourceType === 'video' || (res.resource_type === 'video')) {
              thumbnailUrl = secureUrl.replace(/\.[^/.]+$/, '.jpg');
            }

            resolve({
              secureUrl,
              publicId,
              duration,
              format,
              bytes,
              thumbnailUrl,
            });
          } catch (e) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData?.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error connecting to Cloudinary'));
      };

      xhr.send(formData);
    });
  };

  try {
    // Try primary preset 'my_preset'
    return await tryUpload(CLOUDINARY_CONFIG.primaryPreset);
  } catch (err: any) {
    console.warn(`Primary preset "${CLOUDINARY_CONFIG.primaryPreset}" failed (${err?.message}). Trying fallback preset "${CLOUDINARY_CONFIG.fallbackPreset}"...`);
    try {
      // Fallback to 'ml_default'
      return await tryUpload(CLOUDINARY_CONFIG.fallbackPreset);
    } catch (fallbackErr: any) {
      console.error('All Cloudinary presets failed:', fallbackErr);
      throw fallbackErr;
    }
  }
}
