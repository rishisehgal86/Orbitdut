import { describe, it, expect } from 'vitest';
import { detectOOH, formatOOHReasons, getOOHPremiumLabel } from '../shared/oohDetection';

describe('OOH Detection', () => {
  describe('detectOOH', () => {
    it('should detect weekend booking (Saturday)', () => {
      // Saturday, Jan 13, 2024 at 10 AM, 2 hours
      const result = detectOOH('2024-01-13', '10:00', 120, 'scheduled');
      
      expect(result.isOOH).toBe(true);
      expect(result.premiumPercent).toBe(50); // Scheduled = +50%
      expect(result.reasons).toContain('Weekend booking (Saturday)');
    });

    it('should detect weekend booking (Sunday)', () => {
      // Sunday, Jan 14, 2024 at 10 AM, 2 hours
      const result = detectOOH('2024-01-14', '10:00', 120, 'scheduled');
      
      expect(result.isOOH).toBe(true);
      expect(result.premiumPercent).toBe(50);
      expect(result.reasons).toContain('Weekend booking (Sunday)');
    });

    it('should detect early morning start (before 9 AM)', () => {
      // Monday, Jan 15, 2024 at 7 AM, 2 hours
      const result = detectOOH('2024-01-15', '07:00', 120, 'next_business_day');
      
      expect(result.isOOH).toBe(true);
      expect(result.premiumPercent).toBe(100); // Next business day = +100%
      expect(result.reasons).toContain('Early morning start (before 9 AM)');
    });

    it('should detect evening start (after 5 PM)', () => {
      // Monday, Jan 15, 2024 at 6 PM, 2 hours
      const result = detectOOH('2024-01-15', '18:00', 120, 'same_business_day');
      
      expect(result.isOOH).toBe(true);
      expect(result.premiumPercent).toBe(150); // Same business day = +150%
      expect(result.reasons).toContain('Evening start (after 5 PM)');
    });

    it('should detect work extending beyond business hours', () => {
      // Monday, Jan 15, 2024 at 4 PM, 2 hours (ends at 6 PM)
      const result = detectOOH('2024-01-15', '16:00', 120, 'scheduled');
      
      expect(result.isOOH).toBe(true);
      expect(result.premiumPercent).toBe(50);
      expect(result.reasons).toContain('Work extends beyond business hours (ends at 18:00)');
    });

    it('should not detect OOH for normal business hours', () => {
      // Monday, Jan 15, 2024 at 10 AM, 2 hours (ends at 12 PM)
      const result = detectOOH('2024-01-15', '10:00', 120, 'scheduled');
      
      expect(result.isOOH).toBe(false);
      expect(result.premiumPercent).toBeNull();
      expect(result.reasons).toHaveLength(0);
    });

    it('should handle multiple OOH reasons', () => {
      // Saturday, Jan 13, 2024 at 6 PM, 2 hours (weekend + evening)
      const result = detectOOH('2024-01-13', '18:00', 120, 'scheduled');
      
      expect(result.isOOH).toBe(true);
      expect(result.premiumPercent).toBe(50);
      expect(result.reasons.length).toBeGreaterThan(1);
      expect(result.reasons).toContain('Weekend booking (Saturday)');
      expect(result.reasons).toContain('Evening start (after 5 PM)');
    });

    it('should apply correct premium for same_business_day', () => {
      // Saturday, Jan 13, 2024 at 10 AM
      const result = detectOOH('2024-01-13', '10:00', 120, 'same_business_day');
      
      expect(result.premiumPercent).toBe(150);
    });

    it('should apply correct premium for next_business_day', () => {
      // Saturday, Jan 13, 2024 at 10 AM
      const result = detectOOH('2024-01-13', '10:00', 120, 'next_business_day');
      
      expect(result.premiumPercent).toBe(100);
    });

    it('should apply correct premium for scheduled', () => {
      // Saturday, Jan 13, 2024 at 10 AM
      const result = detectOOH('2024-01-13', '10:00', 120, 'scheduled');
      
      expect(result.premiumPercent).toBe(50);
    });
  });

  describe('formatOOHReasons', () => {
    it('should format single reason', () => {
      const result = formatOOHReasons(['Weekend booking (Saturday)']);
      expect(result).toBe('Weekend booking (Saturday)');
    });

    it('should format two reasons', () => {
      const result = formatOOHReasons(['Weekend booking (Saturday)', 'Evening start (after 5 PM)']);
      expect(result).toBe('Weekend booking (Saturday) and Evening start (after 5 PM)');
    });

    it('should format three or more reasons', () => {
      const result = formatOOHReasons([
        'Weekend booking (Saturday)',
        'Evening start (after 5 PM)',
        'Work extends beyond business hours (ends at 20:00)'
      ]);
      expect(result).toBe('Weekend booking (Saturday), Evening start (after 5 PM), and Work extends beyond business hours (ends at 20:00)');
    });

    it('should handle empty array', () => {
      const result = formatOOHReasons([]);
      expect(result).toBe('');
    });
  });

  describe('getOOHPremiumLabel', () => {
    it('should format 50% premium', () => {
      expect(getOOHPremiumLabel(50)).toBe('+50% OOH Surcharge');
    });

    it('should format 100% premium', () => {
      expect(getOOHPremiumLabel(100)).toBe('+100% OOH Surcharge');
    });

    it('should format 150% premium', () => {
      expect(getOOHPremiumLabel(150)).toBe('+150% OOH Surcharge');
    });
  });
});
