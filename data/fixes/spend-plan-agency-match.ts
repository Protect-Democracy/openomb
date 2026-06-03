/**
 * Fixes for spend plans without agency abbreviation
 *
 * Matches agency/bureau on regex title convention instead.  Ideally
 * this would only match the agency, bureau, but some files don't have
 * any year information in the file name.
 *
 * IMPORTANT: More specific patterns should be higher up.
 */

export default [
  // No year: https://apportionment-public.max.gov/Spend%20Plans/ACF%20apportionment%20information%20CAPTA.pdf
  {
    pattern: /^ACF apportionment information CAPTA$/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // No year: https://apportionment-public.max.gov/Spend%20Plans/ACF%20apportionment%20information%20CETV.pdf
  {
    pattern: /^ACF apportionment information CETV$/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // No year: https://apportionment-public.max.gov/Spend%20Plans/ACF%20apportionment%20information%20CBCAP.pdf
  {
    pattern: /^ACF apportionment information CBCAP$/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // No year: https://apportionment-public.max.gov/Spend%20Plans/ACF%20apportionment%20information%20CADA%20%281%29.pdf
  {
    pattern: /^ACF apportionment information CADA \(1\)$/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FVPSA_26_Spend%20Plan%20%281%29.pdf
  {
    pattern: /^FVPSA_26_Spend Plan \(1\)$/,
    fiscalYear: '2026',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/CSBG_26_SpendPlanFinal%20%281%29.pdf
  {
    pattern: /^CSBG_26_SpendPlanFinal \(1\)$/,
    fiscalYear: '2026',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/DHSCM_CarryOver_26_SpendPlanFinal%20%281%29.pdf
  {
    pattern: /^DHSCM_CarryOver_26_SpendPlanFinal \(1\)$/,
    fiscalYear: '2026',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/ACF%20apportionment%20information%20DHSCM_May25%20%281%29.pdf
  {
    pattern: /^ACF apportionment information DHSCM_May25 \(1\)$/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
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
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20ACF%20CWRTD%20%281%29.pdf
  {
    pattern: /ACF /,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20FVPSA%20%20and%20DHL%20spend%20plans%20%281%29.pdf
  {
    pattern: /FVPSA /,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  }
] as Array<{ pattern: RegExp; agency: string; bureau?: string; fiscalYear?: string }>;
