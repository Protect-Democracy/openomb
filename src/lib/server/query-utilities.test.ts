/**
 * Tests for query-utilities.ts
 */

// Dependencies
import { expect, test, describe } from 'vitest';
import { DEFAULT_TYPE, SPEND_PLAN_TYPE } from '$config/files';
import { reduceByFileType } from './query-utilities';

describe('reduceByFileType()', () => {
  test('Works for folders', () => {
    const testFolderData = [
      {
        folderId: 'corps-of-engineers-civil-works',
        folder: 'Corps of Engineers (Civil Works)',
        fileType: DEFAULT_TYPE,
        fileCount: 12
      },
      {
        folderId: 'department-of-agriculture',
        folder: 'Department of Agriculture',
        fileType: DEFAULT_TYPE,
        fileCount: 10
      },
      {
        folderId: 'department-of-defense-military-programs',
        folder: 'Department of Defense (Military Programs)',
        fileType: DEFAULT_TYPE,
        fileCount: 10,
        otherField: 'test'
      },
      {
        folderId: 'department-of-defense-military-programs',
        folder: 'Department of Defense (Military Programs)',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 11
      },
      {
        folderId: 'department-of-agriculture',
        folder: 'Department of Agriculture',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 1
      },
      {
        folderId: 'spend-plans',
        folder: 'Spend Plans',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 29
      }
    ];

    expect(reduceByFileType(testFolderData)).toEqual([
      {
        folderId: 'corps-of-engineers-civil-works',
        folder: 'Corps of Engineers (Civil Works)',
        [DEFAULT_TYPE]: 12,
        fileCount: 12
      },
      {
        folderId: 'department-of-agriculture',
        folder: 'Department of Agriculture',
        [DEFAULT_TYPE]: 10,
        [SPEND_PLAN_TYPE]: 1,
        fileCount: 11
      },
      {
        folderId: 'department-of-defense-military-programs',
        folder: 'Department of Defense (Military Programs)',
        [DEFAULT_TYPE]: 10,
        [SPEND_PLAN_TYPE]: 11,
        fileCount: 21,
        otherField: 'test'
      },
      {
        folderId: 'spend-plans',
        folder: 'Spend Plans',
        [SPEND_PLAN_TYPE]: 29,
        fileCount: 29
      }
    ]);
  });

  test('Works for agencies', () => {
    const testAgenciesData = [
      {
        budgetAgencyTitleId: 'corps-of-engineers-civil-works',
        budgetAgencyTitle: 'Corps of Engineers (Civil Works)',
        fileType: DEFAULT_TYPE,
        fileCount: 1452
      },
      {
        budgetAgencyTitleId: 'national-labor-relations-board',
        budgetAgencyTitle: 'National Labor Relations Board',
        fileType: DEFAULT_TYPE,
        fileCount: 2
      },
      {
        budgetAgencyTitleId: 'national-labor-relations-board',
        budgetAgencyTitle: 'National Labor Relations Board',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 5
      },
      {
        budgetAgencyTitleId: 'office-of-personnel-management',
        budgetAgencyTitle: 'Office of Personnel Management',
        fileType: DEFAULT_TYPE,
        fileCount: 90
      },
      {
        budgetAgencyTitleId: 'office-of-personnel-management',
        budgetAgencyTitle: 'Office of Personnel Management',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 132
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 12
      }
    ];

    expect(reduceByFileType(testAgenciesData)).toEqual([
      {
        budgetAgencyTitleId: 'corps-of-engineers-civil-works',
        budgetAgencyTitle: 'Corps of Engineers (Civil Works)',
        [DEFAULT_TYPE]: 1452,
        fileCount: 1452
      },
      {
        budgetAgencyTitleId: 'national-labor-relations-board',
        budgetAgencyTitle: 'National Labor Relations Board',
        [DEFAULT_TYPE]: 2,
        [SPEND_PLAN_TYPE]: 5,
        fileCount: 7
      },
      {
        budgetAgencyTitleId: 'office-of-personnel-management',
        budgetAgencyTitle: 'Office of Personnel Management',
        [DEFAULT_TYPE]: 90,
        [SPEND_PLAN_TYPE]: 132,
        fileCount: 222
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        [SPEND_PLAN_TYPE]: 12,
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
        fileType: SPEND_PLAN_TYPE,
        fileCount: 20
      },
      {
        budgetAgencyTitleId: 'department-of-education',
        budgetAgencyTitle: 'Department of Education',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 173
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'african-development-foundation',
        budgetBureauTitle: 'African Development Foundation',
        fileType: DEFAULT_TYPE,
        fileCount: 304
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'millennium-challenge-corporation',
        budgetBureauTitle: 'Millennium Challenge Corporation',
        fileType: DEFAULT_TYPE,
        fileCount: 276
      },
      {
        budgetAgencyTitleId: 'department-of-health-and-human-services',
        budgetAgencyTitle: 'Department of Health and Human Services',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        fileType: DEFAULT_TYPE,
        fileCount: 192
      },
      {
        budgetAgencyTitleId: 'department-of-health-and-human-services',
        budgetAgencyTitle: 'Department of Health and Human Services',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        fileType: SPEND_PLAN_TYPE,
        fileCount: 90
      }
    ];

    expect(reduceByFileType(testBureauData)).toEqual([
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'african-development-foundation',
        budgetBureauTitle: 'African Development Foundation',
        [SPEND_PLAN_TYPE]: 20,
        [DEFAULT_TYPE]: 304,
        fileCount: 324
      },
      {
        budgetAgencyTitleId: 'department-of-education',
        budgetAgencyTitle: 'Department of Education',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        [SPEND_PLAN_TYPE]: 173,
        fileCount: 173
      },
      {
        budgetAgencyTitleId: 'international-assistance-programs',
        budgetAgencyTitle: 'International Assistance Programs',
        budgetBureauTitleId: 'millennium-challenge-corporation',
        budgetBureauTitle: 'Millennium Challenge Corporation',
        [DEFAULT_TYPE]: 276,
        fileCount: 276
      },
      {
        budgetAgencyTitleId: 'department-of-health-and-human-services',
        budgetAgencyTitle: 'Department of Health and Human Services',
        budgetBureauTitleId: 'departmental-management',
        budgetBureauTitle: 'Departmental Management',
        [DEFAULT_TYPE]: 192,
        [SPEND_PLAN_TYPE]: 90,
        fileCount: 282
      }
    ]);
  });
});
