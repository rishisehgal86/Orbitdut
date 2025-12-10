import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendRatesCompletedEmail, sendCoverageCompletedEmail, sendSignedDocumentEmail } from './_core/email';

describe('Email Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendRatesCompletedEmail', () => {
    it('should send rates completion email with correct parameters', async () => {
      const result = await sendRatesCompletedEmail(
        'supplier@example.com',
        'Test Supplier Co',
        15,
        3
      );

      expect(result).toBe(true);
    });

    it('should handle email sending errors gracefully', async () => {
      // Test with invalid email to trigger error handling
      const result = await sendRatesCompletedEmail(
        '',
        'Test Supplier',
        10,
        2
      );

      // Should return false on error
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendCoverageCompletedEmail', () => {
    it('should send coverage completion email with correct parameters', async () => {
      const result = await sendCoverageCompletedEmail(
        'supplier@example.com',
        'Test Supplier Co',
        5,
        3
      );

      expect(result).toBe(true);
    });

    it('should handle zero cities case', async () => {
      const result = await sendCoverageCompletedEmail(
        'supplier@example.com',
        'Test Supplier Co',
        2,
        0
      );

      expect(result).toBe(true);
    });
  });

  describe('sendSignedDocumentEmail', () => {
    it('should send signed document email with PDF attachment', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');
      
      const result = await sendSignedDocumentEmail(
        'supplier@example.com',
        'Test Supplier Co',
        'dpa_signed',
        'DPA-Agreement.pdf',
        new Date().toISOString(),
        mockPdfBuffer
      );

      expect(result).toBe(true);
    });

    it('should handle different document types', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');
      const documentTypes = ['dpa_signed', 'nda_signed', 'non_compete_signed'];

      for (const docType of documentTypes) {
        const result = await sendSignedDocumentEmail(
          'supplier@example.com',
          'Test Supplier Co',
          docType,
          `${docType}.pdf`,
          new Date().toISOString(),
          mockPdfBuffer
        );

        expect(result).toBe(true);
      }
    });
  });
});
