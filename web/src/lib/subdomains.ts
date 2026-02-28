export const RESERVED_SUBDOMAINS = [
  'dashboard',
  'signup',
  'login',
  'settings',
  'templates',
  'scanner',
  'marketplace',
  'help',
  'pricing',
  'api',
  'www',
];

const RESERVED_LOOKUP = new Set(RESERVED_SUBDOMAINS);

export function isReservedSubdomain(value: string): boolean {
  return RESERVED_LOOKUP.has(value.toLowerCase());
}
