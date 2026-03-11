/**
 * Image utility functions for responsive sizing and lazy loading
 */

/**
 * Generate responsive poster URLs for different screen sizes
 * Useful for srcSet attribute on poster images
 *
 * @param url - Base image URL
 * @param width - Desired width, defaults to different widths for srcSet
 * @returns URL optimized for the given width, or srcSet string
 */
export function getPosterImageUrl(
  url: string | undefined,
  width?: number,
): string {
  if (!url) return "";

  // Already a data URL or placeholder
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  // For TMDB images, optimize the size
  if (url.includes("tmdb.org")) {
    // Use only valid TMDB image sizes (poster + backdrop union).
    const validSizes = [92, 154, 185, 300, 342, 500, 780, 1280];

    const targetSize = width
      ? validSizes.reduce((closest, candidate) =>
          Math.abs(candidate - width) < Math.abs(closest - width)
            ? candidate
            : closest,
        )
      : 500;

    const sizeToken = `w${targetSize}`;

    // Replace existing TMDB size segment if present.
    const replaced = url.replace(/\/(w\d+|original)\//, `/${sizeToken}/`);
    return replaced || url;
  }

  return url;
}

/**
 * Detect if URL points to TMDB-hosted images.
 * Useful to decide whether to bypass Next.js optimizer in constrained deploys.
 */
export function isTmdbImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;

  return /^(https?:)?\/\/(image\.tmdb\.org|www\.themoviedb\.org|media\.themoviedb\.org)\//i.test(
    url,
  );
}

/**
 * Generate srcSet attribute value for responsive images
 * Provides different image sizes for different device widths
 *
 * @param baseUrl - Base image URL
 * @returns srcSet string for use in img srcSet attribute
 */
export function generatePosterSrcSet(baseUrl: string | undefined): string {
  if (!baseUrl) return "";

  // Valid TMDB sizes to avoid broken image candidates on high-DPR screens.
  const sizes = [185, 342, 500, 780];
  return sizes
    .map((width) => `${getPosterImageUrl(baseUrl, width)} ${width}w`)
    .join(", ");
}

/**
 * Generate responsive sizes attribute for img element
 * Helps browser select appropriate image size for viewport
 *
 * @param type - Type of container (poster, hero, thumbnail)
 * @returns sizes attribute value
 */
export function generateImageSizes(
  type: "poster" | "hero" | "thumbnail" = "poster",
): string {
  const sizeConfig: Record<string, string> = {
    poster: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    hero: "100vw",
    thumbnail: "(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw",
  };

  return sizeConfig[type];
}

/**
 * Get a blur-up placeholder color for an image
 * Useful for loading state while image loads
 *
 * @param imageUrl - Image URL (could be used for dominant color extraction)
 * @returns CSS background color for placeholder
 */
export function getImagePlaceholder(imageUrl?: string): string {
  // In a real implementation, you might extract dominant color from image
  // For now, return a subtle gradient
  return "linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(51, 65, 85, 0.1) 100%)";
}

/**
 * Check if image should be lazy loaded
 * Lazy load images below the fold to improve performance
 *
 * @param priority - Whether image is high priority (above the fold)
 * @returns "lazy" or "eager"
 */
export function getImageLoadingAttribute(
  priority: boolean = false,
): "lazy" | "eager" {
  return priority ? "eager" : "lazy";
}

/**
 * Generate avatar image srcSet for different device pixel ratios
 * Avatars are typically small, so limited sizes needed
 *
 * @param baseUrl - Base avatar URL
 * @returns srcSet string for avatar images
 */
export function generateAvatarSrcSet(baseUrl: string | undefined): string {
  if (!baseUrl) return "";

  // Closest sensible TMDB sizes for small avatars.
  const sizes = [92, 154];
  return sizes
    .map((width) => `${getPosterImageUrl(baseUrl, width)} ${width}w`)
    .join(", ");
}

/**
 * Get CSS for aspect ratio padding trick (for maintaining aspect ratio during image load)
 * Prevents layout shift when image loads
 *
 * @param width - Original image width
 * @param height - Original image height
 * @returns Padding-bottom percentage for aspect ratio box
 */
export function getAspectRatioPadding(width: number, height: number): number {
  return (height / width) * 100;
}
