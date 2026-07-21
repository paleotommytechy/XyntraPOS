const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload an image file directly to Cloudinary using an unsigned upload preset.
 * 
 * @param file - The HTML File object to upload.
 * @returns The secure CDN URL of the uploaded image.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (
    !cloudName ||
    !uploadPreset ||
    cloudName === 'local-cloudinary-cloud-name' ||
    cloudName === 'your-cloudinary-cloud-name'
  ) {
    throw new Error(
      'Cloudinary upload failed: API credentials are not configured. Please define VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment variables.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 'Failed to upload image to Cloudinary storage server'
    );
  }

  const data = await response.json();
  return data.secure_url;
}
