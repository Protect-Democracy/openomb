/**
 * Default line types (sections)
 */

const defaultLineTypes = [
  {
    lineTypeId: 'obligations',
    name: 'Obligations by Program Activity',
    lowerLimit: 1,
    upperLimit: 999
  },
  {
    lineTypeId: 'budgetary-resources',
    name: 'Budgetary Resources',
    lowerLimit: 1000,
    upperLimit: 1999
  },
  {
    lineTypeId: 'budgetary-resources-status',
    name: 'Status of Budgetary Resources',
    lowerLimit: 2000,
    upperLimit: 2999
  },
  {
    lineTypeId: 'obligated-balance-changes',
    name: 'Change in Obligated Balance',
    lowerLimit: 3000,
    upperLimit: 3999
  },
  {
    lineTypeId: 'budget-authority',
    name: 'Budget Authority and Outlays, Net',
    lowerLimit: 4000,
    upperLimit: 4999
  },
  {
    lineTypeId: 'memorandum',
    name: 'Memorandum (non-add) entries',
    lowerLimit: 5000,
    upperLimit: 5999
  },
  {
    lineTypeId: 'budgetary-resources-application',
    name: 'Application of Budgetary Resources',
    lowerLimit: 6000,
    upperLimit: 6999
  },
  {
    lineTypeId: 'unfunded-deficiencies',
    name: 'Unfunded Deficiencies',
    lowerLimit: 7000,
    upperLimit: 7999
  },
  {
    lineTypeId: 'guaranteed-loan-levels',
    name: 'Guaranteed Loan Levels and Applications',
    lowerLimit: 8000,
    upperLimit: 8999
  },
  {
    lineTypeId: 'other',
    name: 'Other'
  }
];

export default defaultLineTypes;
