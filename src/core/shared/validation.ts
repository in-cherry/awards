const CUID_REGEX = /^c[a-z0-9]{24}$/;

export function isCuid(value: string): boolean {
  return CUID_REGEX.test(value);
}