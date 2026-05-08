/**
 * Fixes for spend plans without agency abbreviation
 *
 * Matches agency/bureau on regex title convention instead.  Ideally
 * this would only match the agency, bureau, but some files don't have
 * any year information in the file name.
 */

export default [
  {
    pattern: /State (Diplomatic|Embassy|CIO)/,
    agency: 'Department of State'
  },
  {
    pattern: /Peace Corps/,
    agency: 'International Assistance Programs',
    bureau: 'Peace Corps'
  },
  {
    pattern: /DFC Operating Plan/,
    agency: 'International Assistance Programs',
    bureau: 'United States International Development Finance Corporation'
  },
  {
    pattern: /IMLS /,
    agency: 'Institute of Museum and Library Services',
    bureau: 'Institute of Museum and Library Services'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY26%20Qs%201%20and%202%20TANF%20HMRF%20and%20WR%20Spend%20Plan.pdf
  {
    pattern: /TANF\s+HMRF/,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/ACF%20SOT%20ATIP%2025-25%20Spend%20Plan.pdf
  {
    pattern: /ACF\s+SOT/,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/CN%20Spend%20Plan.pdf
  {
    pattern: /CN\s+Spend\s+Plan/,
    fiscalYear: '2026',
    agency: 'Department of Agriculture',
    bureau: 'Food and Nutrition Service'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/CAP%20FY%2025%20Spend%20Plans%20-%20fmnp.csfp.sfmnp.tefap-admin.pdf
  {
    pattern: /CAP\s+FY\s+25\s+Spend\s+Plans/,
    agency: 'Department of Agriculture',
    bureau: 'Food and Nutrition Service'
  }
] as Array<{ pattern: RegExp; agency: string; bureau?: string; fiscalYear?: string }>;
