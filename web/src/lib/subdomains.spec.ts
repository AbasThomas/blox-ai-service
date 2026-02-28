import { isReservedSubdomain } from './subdomains';

describe('isReservedSubdomain', () => {
  it('returns true for reserved names', () => {
    expect(isReservedSubdomain('dashboard')).toBe(true);
    expect(isReservedSubdomain('www')).toBe(true);
  });

  it('returns false for publishable names', () => {
    expect(isReservedSubdomain('alicia-stone')).toBe(false);
  });
});
