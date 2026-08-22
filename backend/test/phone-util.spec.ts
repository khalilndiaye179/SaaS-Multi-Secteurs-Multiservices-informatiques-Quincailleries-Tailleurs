import { normalizeSenegalPhone } from '../src/common/utils/phone.util';

describe('normalizeSenegalPhone', () => {
  it('doit normaliser les numéros sénégalais au format E.164 (221XXXXXXXXX)', () => {
    expect(normalizeSenegalPhone('+221 77 123 45 67')).toBe('221771234567');
    expect(normalizeSenegalPhone('00221 78 987 65 43')).toBe('221789876543');
    expect(normalizeSenegalPhone('76-000-00-00')).toBe('221760000000');
    expect(normalizeSenegalPhone('771234567')).toBe('221771234567');
  });

  it('doit retourner null pour les numéros invalides ou trop courts', () => {
    expect(normalizeSenegalPhone('12345')).toBeNull();
    expect(normalizeSenegalPhone('')).toBeNull();
    expect(normalizeSenegalPhone(null)).toBeNull();
    expect(normalizeSenegalPhone(undefined)).toBeNull();
  });
});
