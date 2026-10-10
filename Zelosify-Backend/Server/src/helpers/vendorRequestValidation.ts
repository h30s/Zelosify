/**
 * Validation utilities for vendor request endpoints
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Sanitize filename for S3 storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

export const PROFILE_CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function getProfileContentType(filename: string): string | null {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  return PROFILE_CONTENT_TYPES[extension] || null;
}
