import { describe, it, expect } from 'vitest';
import { parseCriterion, parseUrlSearchParams, criterionToUrlSearchParams } from './searches';
import type {
  SavedSearchCriterion,
  LegacySearchCriterion,
  SavedSearchCriterionUrl
} from '$schema/searches';

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

    it('should handle agencyBureau', () => {
      const urlInput: SavedSearchCriterionUrl = {
        agencyBureau: '011,04'
      };

      const result = parseCriterion(urlInput);

      expect(result.agencyBureau).toBe('011,04');
    });

    it('should handle partial agencyBureau strings', () => {
      const urlInput: SavedSearchCriterionUrl = {
        agencyBureau: '011'
      };

      const result = parseCriterion(urlInput);

      expect(result.agencyBureau).toBe('011');
    });

    it('should handle empty strings in agencyBureau', () => {
      const input = { agencyBureau: '' };
      const result = parseCriterion(input);
      expect(result.agencyBureau).toBeUndefined();
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

  describe('parity of handling different inputs', () => {
    it('Empty', () => {
      const outputEmpty: SavedSearchCriterion = {
        term: undefined,
        tafs: undefined,
        account: undefined,
        agencyBureau: undefined,
        approver: undefined,
        year: undefined,
        lineNum: undefined,
        footnoteNum: undefined,
        apportionmentType: undefined,
        approvedStart: undefined,
        approvedEnd: undefined
      };

      const urlInput: SavedSearchCriterionUrl = {
        term: '',
        tafs: '',
        account: '',
        agencyBureau: '',
        approver: '',
        year: '',
        lineNum: '',
        footnoteNum: '',
        apportionmentType: '',
        approvedStart: '',
        approvedEnd: ''
      };

      const legacyInput: LegacySearchCriterion = {
        term: '',
        tafs: '',
        account: '',
        agencyBureau: '',
        approver: '',
        year: '',
        lineNum: '',
        footnoteNum: '',
        apportionmentType: '',
        approvedStart: undefined,
        approvedEnd: undefined
      };

      const legacyInput2: LegacySearchCriterion = {
        term: [''],
        tafs: '',
        account: '',
        agencyBureau: '',
        approver: '',
        year: [],
        lineNum: [''],
        footnoteNum: [],
        apportionmentType: [],
        approvedStart: undefined,
        approvedEnd: undefined
      };

      const toCompare = [urlInput, legacyInput, legacyInput2].map(parseCriterion);

      toCompare.forEach((result) => {
        expect(result).toEqual(outputEmpty);
      });
    });
  });
});

describe('parseUrlSearchParams', () => {
  it('should return an empty criterion object when search params are empty', () => {
    const params = new URLSearchParams();
    const result = parseUrlSearchParams(params);

    expect(result).toEqual({
      term: undefined,
      tafs: undefined,
      account: undefined,
      agency: undefined,
      bureau: undefined,
      approver: undefined,
      year: undefined,
      lineNum: undefined,
      footnoteNum: undefined,
      apportionmentType: undefined,
      approvedStart: undefined,
      approvedEnd: undefined
    });
  });

  it('should parse valid allowed parameters and pass them to parseCriterion', () => {
    const params = new URLSearchParams(
      'term=apple,banana&year=2023,2024&agencyBureau=011,04&tafs=123'
    );
    const result = parseUrlSearchParams(params);

    expect(result.term).toEqual(['apple', 'banana']);
    expect(result.year).toEqual([2023, 2024]);
    expect(result.agencyBureau).toBe('011,04');
    expect(result.tafs).toBe('123');
  });

  it('should ignore parameters that are not in the allowed list', () => {
    // Includes valid params ('term', 'account') and garbage/pagination params ('page', 'limit', 'sort')
    const params = new URLSearchParams(
      'term=test&account=456&page=2&limit=50&sort=asc&randomKey=ignoreMe'
    );
    const result = parseUrlSearchParams(params);

    expect(result.term).toEqual(['test']);
    expect(result.account).toBe('456');

    // Make sure we didn't accidentally attach unallowed keys onto the returned object
    // (TypeScript normally complains about this anyway, but good to check runtime behavior)
    expect(result).not.toHaveProperty('page');
    expect(result).not.toHaveProperty('limit');
    expect(result).not.toHaveProperty('sort');
    expect(result).not.toHaveProperty('randomKey');
  });

  it('should handle typical encoded characters from URLs correctly', () => {
    // Tests spaces encoded as %20 or +
    const params = new URLSearchParams('term=budget+request,%20supplemental&tafs=011%202024');
    const result = parseUrlSearchParams(params);

    expect(result.term).toEqual(['budget request', 'supplemental']);
    expect(result.tafs).toBe('011 2024');
  });

  it('should handle repeated search parameters by combining them', () => {
    // URL with repeated 'year' and 'term' parameters
    const params = new URLSearchParams('year=2022&year=2023&term=apple&term=banana');
    const result = parseUrlSearchParams(params);

    expect(result.year).toEqual([2022, 2023]);
    expect(result.term).toEqual(['apple', 'banana']);
  });

  it('should handle comma separated terms', () => {
    const params = new URLSearchParams('year=2022%2C2023&term=apple,banana');
    const result = parseUrlSearchParams(params);

    expect(result.year).toEqual([2022, 2023]);
    expect(result.term).toEqual(['apple', 'banana']);
  });
});

describe('criterionToUrlSearchParams', () => {
  it('should return an empty URLSearchParams with placeholder', () => {
    const criterion: SavedSearchCriterion = {};
    const result = criterionToUrlSearchParams(criterion);

    expect(result.toString()).toContain('term=');
  });

  it('should ignore undefined values', () => {
    const criterion: SavedSearchCriterion = {
      tafs: undefined,
      account: '1234',
      term: undefined
    };
    const result = criterionToUrlSearchParams(criterion);

    expect(result.has('tafs')).toBe(false);
    expect(result.has('term')).toBe(false);
    expect(result.get('account')).toBe('1234');
  });

  it('should correctly handle single string values', () => {
    const criterion: SavedSearchCriterion = {
      tafs: '012-3456',
      agencyBureau: '012,34',
      account: '1234'
    };
    const result = criterionToUrlSearchParams(criterion);

    expect(result.get('tafs')).toBe('012-3456');
    expect(result.get('agencyBureau')).toBe('012,34');
    expect(result.get('account')).toBe('1234');
  });

  it('should correctly handle arrays by appending multiple values', () => {
    const criterion: SavedSearchCriterion = {
      term: ['budget', 'apportionment'],
      year: [2022, 2023],
      apportionmentType: ['spreadsheet', 'letter']
    };
    const result = criterionToUrlSearchParams(criterion);

    expect(result.getAll('term')).toEqual(['budget', 'apportionment']);
    expect(result.getAll('year')).toEqual(['2022', '2023']);
    expect(result.getAll('apportionmentType')).toEqual(['spreadsheet', 'letter']);
  });

  it('should correctly format Date objects using the iso-date formatter', () => {
    const start = new Date('2023-01-01T12:00:00Z');
    const end = new Date('2023-12-31T12:00:00Z');

    const criterion: SavedSearchCriterion = {
      approvedStart: start,
      approvedEnd: end
    };

    const result = criterionToUrlSearchParams(criterion);

    expect(result.get('approvedStart')).toBe('2023-01-01');
    expect(result.get('approvedEnd')).toBe('2023-12-31');
  });

  it('should handle a complex criterion object with mixed types', () => {
    const criterion: SavedSearchCriterion = {
      term: ['test'],
      tafs: '012-3456',
      year: [2024],
      approvedStart: new Date('2024-05-01T00:00:00Z'),
      account: undefined
    };

    const result = criterionToUrlSearchParams(criterion);

    expect(result.toString()).toBe('term=test&tafs=012-3456&year=2024&approvedStart=2024-05-01');
  });
});
