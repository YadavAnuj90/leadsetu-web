/**
 * Client-side helpers for optional organization name & logo uploads.
 */

export function getCompanyDisplayName(
  tenant?: { companyName?: string | null; name?: string | null } | null,
): string {
  return (tenant?.companyName || '').trim();
}

export async function prepareOrganizationLogoDataUrl(file: File): Promise<string> {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
  ];
  if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Please upload a PNG, JPG, WEBP, or SVG logo image.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Logo image must be smaller than 5 MB.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected logo file.'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/svg+xml' || rawDataUrl.length <= 160_000) {
    return rawDataUrl;
  }

  // Resize large raster images cleanly to max 256x256 so JSON payload stays tiny & crisp
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 256;
      const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      const w = Math.max(1, Math.round((img.width || maxDim) * scale));
      const h = Math.max(1, Math.round((img.height || maxDim) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/webp', 0.88);
      resolve(compressed.startsWith('data:image/') ? compressed : canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
