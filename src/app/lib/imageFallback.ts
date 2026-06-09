import type { SyntheticEvent } from "react";

// Inline gray placeholder so a broken product/order image degrades gracefully
// instead of surfacing the browser's broken-image icon.
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
      '<rect width="100%" height="100%" fill="#27272a"/>' +
      '<text x="50%" y="50%" fill="#71717a" font-family="sans-serif" font-size="22" ' +
      'text-anchor="middle" dominant-baseline="middle">ƏtirX</text></svg>'
  );

export function onImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  // Guard against loops if the placeholder itself somehow fails to load.
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = "1";
  img.src = FALLBACK_IMAGE;
}
