/**
 * Generates a deterministic, clean slug ID for PC Cases based on brand and case name.
 * Prevents duplicate cards when editing or re-importing cases.
 */
export const generateCaseId = (brand: string, name: string): string => {
  const cleanBrand = (brand || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const cleanName = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!cleanBrand || cleanName.startsWith(cleanBrand)) {
    return cleanName || `case-${Date.now()}`;
  }

  return `${cleanBrand}-${cleanName}`;
};
