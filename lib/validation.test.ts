import { describe, it, expect } from 'vitest';
import { validateName, validateEmail, validatePhone } from './validation';

describe('Validation Functions', () => {
  it('validates names correctly', () => {
    expect(validateName('Ahmad')).toBeNull();
    expect(validateName('123')).toMatch(/numbers/);
  });
  
  it('validates email correctly', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('invalid')).toMatch(/valid email/);
  });
});