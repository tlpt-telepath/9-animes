const IMAGE_PROXY = process.env.NEXT_PUBLIC_IMAGE_PROXY || '';

export function toSafeImageSrc(originalUrl: string | null): string | null {
  if (!originalUrl) return null;
  if (!IMAGE_PROXY) return originalUrl;
  return `${IMAGE_PROXY}${encodeURIComponent(originalUrl)}`;
}
