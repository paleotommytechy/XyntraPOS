import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, capitalize, generateRandomCode, verifyWebhookSignature } from '../index';

describe('packages/utils', () => {
  describe('formatCurrency', () => {
    it('formats NGN currency correctly', () => {
      const result = formatCurrency(5000, 'NGN');
      expect(result).toContain('5,000');
    });

    it('formats USD currency correctly', () => {
      const result = formatCurrency(120.5, 'USD');
      expect(result).toContain('120.50');
      expect(result).toContain('$');
    });

    it('handles fallback for unknown currency codes', () => {
      const result = formatCurrency(100, 'XYZ');
      expect(result).toBe('XYZ 100.00');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO date string with time', () => {
      const dateStr = '2026-07-23T12:00:00.000Z';
      const result = formatDate(dateStr, true);
      expect(result).toContain('2026');
      expect(result).toContain('Jul');
    });

    it('returns Invalid Date for malformed date string', () => {
      const result = formatDate('not-a-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first character of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('xyntra')).toBe('Xyntra');
    });

    it('returns empty string when given empty input', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('generateRandomCode', () => {
    it('generates random code with given prefix and default length', () => {
      const code = generateRandomCode('PROD');
      expect(code.startsWith('PROD-')).toBe(true);
      expect(code.length).toBe(13); // 'PROD-' (5) + 8 chars = 13
    });
  });

  describe('verifyWebhookSignature', () => {
    it('returns false when signature or secret or body is empty', async () => {
      const isValid = await verifyWebhookSignature('', '', '');
      expect(isValid).toBe(false);
    });
  });
});
