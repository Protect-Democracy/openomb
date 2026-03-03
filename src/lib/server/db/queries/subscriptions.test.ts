import { describe, it, expect } from 'vitest';
import { searchCriterionDescription } from './subscriptions';

describe('searchCriterionDescription', () => {
  it('should return "(no filters)" when the record or criterion is missing', () => {
    expect(searchCriterionDescription(undefined)).toBe('(no filters)');
    expect(searchCriterionDescription({ id: '123' } as any)).toBe('(no filters)');
    expect(searchCriterionDescription({ criterion: {} } as any)).toBe('(no filters)');
  });

  it('should format single text fields correctly', () => {
    const recordWithTerm = { criterion: { term: ['budget'] } } as any;
    expect(searchCriterionDescription(recordWithTerm)).toBe("Keyword: 'budget'");

    const recordWithTafs = { criterion: { tafs: '011-2024' } } as any;
    expect(searchCriterionDescription(recordWithTafs)).toBe('TAFS: 011-2024');
  });

  it('should combine multiple criteria joined by semicolons', () => {
    const record = {
      criterion: {
        agencyBureau: '011,04',
        account: '1234'
      }
    } as any;

    expect(searchCriterionDescription(record)).toBe('Agency / Bureau: 011 / 04; Account: 1234');
  });

  it('should format array values correctly (e.g., multiple years or line numbers)', () => {
    const record = {
      criterion: {
        year: [2023, 2024],
        lineNum: ['101', '102']
      }
    } as any;

    expect(searchCriterionDescription(record)).toBe('Year(s): 2023, 2024; Line(s): 101, 102');
  });

  it('should gracefully handle legacy string formats instead of arrays', () => {
    const record = {
      criterion: {
        year: '2022',
        apportionmentType: 'spreadsheet'
      }
    } as any;

    expect(searchCriterionDescription(record)).toBe(
      'Year: 2022; Apportionment Type: Standard (Excel)'
    );
  });

  it('should format date fields correctly', () => {
    const record = {
      criterion: {
        approvedStart: '2023-01-01',
        approvedEnd: '2023-12-31'
      }
    } as any;

    const result = searchCriterionDescription(record);
    expect(result).toBe('Approved After: 1/1/23; Approved Before: 12/31/23');
  });

  it('should handle agency bureau options', () => {
    const record = {
      criterion: {
        agencyBureau: '011,04'
      }
    } as any;

    expect(
      searchCriterionDescription(record, {
        agencyBureauOptions: [
          {
            budgetAgencyTitleId: '011',
            budgetBureauTitleId: '04',
            budgetAgencyTitle: 'Department of State',
            budgetBureauTitle: 'Diplomatic Security',
            fileCount: 10
          }
        ]
      })
    ).toBe('Agency / Bureau: Department of State / Diplomatic Security');
  });

  it('should handle approver title options', () => {
    const record = {
      criterion: {
        approver: ['deputy-associate-director-for-health-programs']
      }
    } as any;

    expect(
      searchCriterionDescription(record, {
        approverTitleOptions: [
          {
            value: 'deputy-associate-director-for-health-programs',
            label: 'Deputy Associate Director for Health Programs'
          }
        ]
      })
    ).toBe('Approver: Deputy Associate Director for Health Programs');
  });
});
