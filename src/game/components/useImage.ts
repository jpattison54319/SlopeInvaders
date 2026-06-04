import { useEffect, useState } from 'react';

/**
 * Load an image URL into an HTMLImageElement for use as a Konva <Image>.
 * Returns undefined until the image has loaded. (A tiny local replacement for
 * the `use-image` package so we don't add a dependency.)
 */
export function useImage(src: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>();

  useEffect(() => {
    const img = new window.Image();
    let active = true;
    const handleLoad = () => {
      if (active) setImage(img);
    };
    img.addEventListener('load', handleLoad);
    img.src = src;
    // If it was cached and already complete, fire immediately.
    if (img.complete && img.naturalWidth > 0) handleLoad();
    return () => {
      active = false;
      img.removeEventListener('load', handleLoad);
    };
  }, [src]);

  return image;
}
