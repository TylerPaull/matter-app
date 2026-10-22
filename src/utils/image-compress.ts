/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Optimizes high-resolution phone captures/uploads to a balanced 1600px max dimension
 * and JPEG 0.85 quality. This preserves crisp grain, texture, and specular reflections
 * while reducing 10MB+ raw payloads down to ~250KB for rapid, timeout-free multimodal inference.
 */
export async function optimizeImageForAnalysis(input: string | File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const MAX_DIMENSION = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof input === 'string' ? input : '');
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to efficient JPEG
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(optimizedDataUrl);
      } catch (err) {
        console.warn('Image optimization fallback:', err);
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for optimization:', err);
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          img.src = result;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}
