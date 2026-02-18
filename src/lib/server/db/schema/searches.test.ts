import { describe, it, expect, vi } from 'vitest';
import { parseCriterion, type SavedSearchCriterionUrl } from './searches';

describe('parseCriterion', () => {
  it('should return an empty object when criterion is undefined', () => {
    expect(parseCriterion(undefined)).toEqual({});
  });

  describe('url parsing (SavedSearchCriterionUrl)', () => {
    it('should split comma-separated strings into arrays', () => {
      const urlInput: SavedSearchCriterionUrl = {
        term: '    apple    , banana  ',
        year: '2023, 2024',
        lineNum: '101, 102'
      };

      const result = parseCriterion(urlInput);

      expect(result.term).toEqual(['apple', 'banana']);
      expect(result.year).toEqual([2023, 2024]); // Note: parsed to numbers
      expect(result.lineNum).toEqual(['101', '102']);
    });

    it('should split agencyBureau into separate agency and bureau fields', () => {
      const urlInput: SavedSearchCriterionUrl = {
        agencyBureau: '011,04'
      };

      const result = parseCriterion(urlInput);

      expect(result.agency).toBe('011');
      expect(result.bureau).toBe('04');
    });

    it('should handle partial agencyBureau strings', () => {
      const urlInput: SavedSearchCriterionUrl = {
        agencyBureau: '011'
      };

      const result = parseCriterion(urlInput);

      expect(result.agency).toBe('011');
      expect(result.bureau).toBeUndefined();
    });

    it('should handle empty strings in agencyBureau', () => {
      const input = { agencyBureau: '' };
      const result = parseCriterion(input);
      expect(result.agency).toBeUndefined();
      expect(result.bureau).toBeUndefined();
    });
  });

  describe('legacy handling (SavedSearchCriterion)', () => {
    it('should preserve existing arrays without modification', () => {
      const input = {
        term: ['existing', 'array'],
        year: [2021, 2022]
      };

      const result = parseCriterion(input);

      expect(result.term).toEqual(['existing', 'array']);
      expect(result.year).toEqual([2021, 2022]);
    });

    it('should prefer explicit agency/bureau over agencyBureau if both exist', () => {
      // Testing the "agency" in criterion check
      const input = {
        agency: '020',
        bureau: '01',
        agencyBureau: '999,99' // Should be ignored
      } as any;

      const result = parseCriterion(input);

      expect(result.agency).toBe('020');
      expect(result.bureau).toBe('01');
    });
  });

  describe('date Handling', () => {
    it('should parse valid Date objects', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const input = {
        approvedStart: startDate
      };

      const result = parseCriterion(input);

      expect(result.approvedStart).toBeInstanceOf(Date);
      expect(result.approvedStart?.toISOString()).toBe(startDate.toISOString());
    });

    it('should try to parse date strings', () => {
      const input = {
        approvedStart: '2023-01-01'
      };

      const result = parseCriterion(input);
      expect(result.approvedStart).toBeInstanceOf(Date);
      expect(result.approvedStart?.toISOString().split('T')[0]).toBe('2023-01-01');
    });
  });
});
