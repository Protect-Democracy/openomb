/**
 * Tests for query-utilities.ts
 */

// Dependencies
import { expect, test, describe } from 'vitest';
import { apportionmentTypeStandard, apportionmentTypeSpendPlan } from '$config/files';
import { reduceByFileType } from './query-utilities';

describe('reduceByFileType()', () => {
  test('Works for folders', () => {
    const testFolderData = [
      {
        folderId: 'corps-of-engineers-civil-works',
        folder: 'Corps of Engineers (Civil Works)',
        fileType: apportionmentTypeStandard,
        fileCount: 12
      },
      {
        folderId: 'department-of-agriculture',
        folder: 'Department of Agriculture',
        fileType: apportionmentTypeStandard,
        fileCount: 10
      },
      {
        folderId: 'department-of-defense-military-programs',
        folder: 'Department of Defense (Military Programs)',
        fileType: apportionmentTypeStandard,
        fileCount: 10,
        otherField: 'test'
      },
      {
        folderId: 'department-of-defense-military-programs',
        folder: 'Department of Defense (Military Programs)',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 11
      },
      {
        folderId: 'department-of-agriculture',
        folder: 'Department of Agriculture',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 1
      },
      {
        folderId: 'spend-plans',
        folder: 'Spend Plans',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 29
      }
    ];

    expect(reduceByFileType(testFolderData)).toEqual([
      {
        folderId: 'corps-of-engineers-civil-works',
        folder: 'Corps of Engineers (Civil Works)',
        [apportionmentTypeStandard]: 12,
        fileCount: 12
      },
      {
        folderId: 'department-of-agriculture',
        folder: 'Department of Agriculture',
        [apportionmentTypeStandard]: 10,
        [apportionmentTypeSpendPlan]: 1,
        fileCount: 11
      },
      {
        folderId: 'department-of-defense-military-programs',
        folder: 'Department of Defense (Military Programs)',
        [apportionmentTypeStandard]: 10,
        [apportionmentTypeSpendPlan]: 11,
        fileCount: 21,
        otherField: 'test'
      },
      {
        folderId: 'spend-plans',
        folder: 'Spend Plans',
        [apportionmentTypeSpendPlan]: 29,
        fileCount: 29
      }
    ]);
  });

  test('Works for agencies', () => {
    const testAgenciesData = [
      {
        budgetAgencyTitleId: 'corps-of-engineers-civil-works',
        budgetAgencyTitle: 'Corps of Engineers (Civil Works)',
        fileType: apportionmentTypeStandard,
        fileCount: 1452
      },
      {
        budgetAgencyTitleId: 'national-labor-relations-board',
        budgetAgencyTitle: 'National Labor Relations Board',
        fileType: apportionmentTypeStandard,
        fileCount: 2
      },
      {
        budgetAgencyTitleId: 'national-labor-relations-board',
        budgetAgencyTitle: 'National Labor Relations Board',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 5
      },
      {
        budgetAgencyTitleId: 'office-of-personnel-management',
        budgetAgencyTitle: 'Office of Personnel Management',
        fileType: apportionmentTypeStandard,
        fileCount: 90
      },
      {
        budgetAgencyTitleId: 'office-of-personnel-management',
        budgetAgencyTitle: 'Office of Personnel Management',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 132
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 12
      }
    ];

    expect(reduceByFileType(testAgenciesData)).toEqual([
      {
        budgetAgencyTitleId: 'corps-of-engineers-civil-works',
        budgetAgencyTitle: 'Corps of Engineers (Civil Works)',
        [apportionmentTypeStandard]: 1452,
        fileCount: 1452
      },
      {
        budgetAgencyTitleId: 'national-labor-relations-board',
        budgetAgencyTitle: 'National Labor Relations Board',
        [apportionmentTypeStandard]: 2,
        [apportionmentTypeSpendPlan]: 5,
        fileCount: 7
      },
      {
        budgetAgencyTitleId: 'office-of-personnel-management',
        budgetAgencyTitle: 'Office of Personnel Management',
        [apportionmentTypeStandard]: 90,
        [apportionmentTypeSpendPlan]: 132,
        fileCount: 222
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        [apportionmentTypeSpendPlan]: 12,
        fileCount: 12
      }
    ]);
  });

  test('Works for bureaus', () => {
    const testBureauData = [
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'african-development-foundation',
        budgetBureauTitle: 'African Development Foundation',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 20
      },
      {
        budgetAgencyTitleId: 'department-of-education',
        budgetAgencyTitle: 'Department of Education',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 173
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'african-development-foundation',
        budgetBureauTitle: 'African Development Foundation',
        fileType: apportionmentTypeStandard,
        fileCount: 304
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'millennium-challenge-corporation',
        budgetBureauTitle: 'Millennium Challenge Corporation',
        fileType: apportionmentTypeStandard,
        fileCount: 276
      },
      {
        budgetAgencyTitleId: 'department-of-health-and-human-services',
        budgetAgencyTitle: 'Department of Health and Human Services',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        fileType: apportionmentTypeStandard,
        fileCount: 192
      },
      {
        budgetAgencyTitleId: 'department-of-health-and-human-services',
        budgetAgencyTitle: 'Department of Health and Human Services',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        fileType: apportionmentTypeSpendPlan,
        fileCount: 90
      }
    ];

    expect(reduceByFileType(testBureauData)).toEqual([
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'african-development-foundation',
        budgetBureauTitle: 'African Development Foundation',
        [apportionmentTypeSpendPlan]: 20,
        [apportionmentTypeStandard]: 304,
        fileCount: 324
      },
      {
        budgetAgencyTitleId: 'department-of-education',
        budgetAgencyTitle: 'Department of Education',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        [apportionmentTypeSpendPlan]: 173,
        fileCount: 173
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'millennium-challenge-corporation',
        budgetBureauTitle: 'Millennium Challenge Corporation',
        [apportionmentTypeStandard]: 276,
        fileCount: 276
      },
      {
        budgetAgencyTitleId: 'department-of-health-and-human-services',
        budgetAgencyTitle: 'Department of Health and Human Services',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        [apportionmentTypeStandard]: 192,
        [apportionmentTypeSpendPlan]: 90,
        fileCount: 282
      }
    ]);
  });
});
