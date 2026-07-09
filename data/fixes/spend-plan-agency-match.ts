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
  // https://apportionment-public.max.gov/Spend%20Plans/ICE%20OBBBA%20Spend%20Plan%20%281%29.pdf
  {
    pattern: /ICE OBBBA Spend Plan \(1\)/,
    agency: 'Department of Homeland Security',
    bureau: 'U.S. Immigration and Customs Enforcement',
    fiscalYear: '2027'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/OSEM%20Apportionment%20Spend%20Plan%20%281%29.pdf
  {
    pattern: /OSEM Apportionment Spend Plan \(1\)/,
    agency: 'Department of Homeland Security',
    bureau: 'Office of the Secretary and Executive Management',
    fiscalYear: '2026'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/Copy%20of%20OSEC%20Supplemental%20Spend%20Plan_Template%20-FPAC-BC%20IRA%20Sec%2022007%28e%29%20-%206014%20Administrative%20Costs%20for%20Implementation%20%28Dec%2017%29%20%282%29.pdf
  // FPAC-BC (but no year)
  {
    pattern: /OSEC Supplemental Spend Plan_Template.*FPAC-BC.*Dec 17/,
    fiscalYear: '2022',
    agency: 'Department of Agriculture',
    bureay: 'Farm Production and Conservation'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/TPP%20Spend%20Plan%20for%20OMB%20-%20Remaining%20TPP%20Tier%202%20Grants%208.8.25%20%282%29.pdf
  {
    pattern: /TPP Spend Plan for OMB - Remaining TPP Tier 2 Grants 8.8.25 \(2\)/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/Refugee%20Spend%20Plan%20OMB%20Responses%2011.18.2025%20%281%29.pdf
  {
    pattern: /Refugee Spend Plan OMB Responses 11.18.2025 \(1\)/,
    fiscalYear: '2026',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/Title%20X%20Spend%20Plan%20for%20OMB%20-%20Remaining%20Title%20X%20Grants%208.8.25%20%284%29.pdf
  {
    pattern: /Title X Spend Plan for OMB - Remaining Title X Grants 8.8.25 \(4\)/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Health Resources and Services Administration'
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
  // https://apportionment-public.max.gov/Spend%20Plans/2025%20Supplemental_State_Tables_for_1512%20%281%29.pdf
  {
    pattern: /2025 Supplemental_State_Tables_for_1512/i,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/ORR_RPB_Recoveries_To%20OMB%20PC%20Updated%209.2.25%20%281%29.pdf
  {
    pattern: /ORR_RPB_Recoveries_To OMB PC Updated 9.2.25 \(1\)/,
    fiscalYear: '2025',
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/Commodity%20Procurement%206E%20spend%20plan%20%286%29.pdf
  {
    pattern: /Commodity Procurement 6E spend plan \(6\)/,
    fiscalYear: '2025',
    agency: 'Department of Agriculture',
    bureau: 'Food and Nutrition Service'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/CBP%20O%26S%20Spend%20Plan%203-6-26%20%282%29.pdf
  {
    pattern: /CBP O&S Spend Plan 3-6-26 \(2\)/,
    fiscalYear: '2026',
    agency: 'Department of Homeland Security',
    bureau: 'U.S. Customs and Border Protection'
  },

  // General patterns
  {
    pattern: /(^|[^a-z])State (Diplomatic|Embassy|CIO)([^a-z]|$)/i,
    agency: 'Department of State'
  },
  {
    pattern: /(^|[^a-z])Peace Corps([^a-z]|$)/i,
    agency: 'International Assistance Programs',
    bureau: 'Peace Corps'
  },
  {
    pattern: /DFC Operating Plan/,
    agency: 'International Assistance Programs',
    bureau: 'United States International Development Finance Corporation'
  },
  {
    pattern: /(^|[^a-z])ORR([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  {
    pattern: /(^|[^a-z])IMLS([^a-z]|$)/i,
    agency: 'Institute of Museum and Library Services',
    bureau: 'Institute of Museum and Library Services'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/SNPLMA%20-%20FY2025%20and%202026%20Spend%20Plan%20%281%29.pdf
  {
    pattern: /(^|[^a-z])SNPLMA([^a-z]|$)/i,
    agency: 'Department of the Interior',
    bureau: 'Bureau of Land Management'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY26%20Qs%201%20and%202%20TANF%20HMRF%20and%20WR%20Spend%20Plan.pdf
  {
    pattern: /(^|[^a-z])TANF\s+HMRF([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/ACF%20SOT%20ATIP%2025-25%20Spend%20Plan.pdf
  {
    pattern: /(^|[^a-z])ACF\s+SOT([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/Spend%20Plan%20502%20Direct%20FY25%20%282%29.pdf
  {
    pattern: /(^|[^a-z])502\s+Direct([^a-z]|$)/i,
    agency: 'Department of Agriculture'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20ACF%20CWRTD%20%281%29.pdf
  {
    pattern: /(^|[^a-z])ACF([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/LIHEAP_FY25_spendplan%20%281%29.pdf
  {
    pattern: /(^|[^a-z])LIHEAP([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20FVPSA%20%20and%20DHL%20spend%20plans%20%281%29.pdf
  {
    pattern: /(^|[^a-z])FVPSA([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/Repat%20Spend%20Plan%20Narrative%20-%20FY%2026%20-%20toOMB.pdf
  // https://apportionment-public.max.gov/Spend%20Plans/Repatriation%20FY2025%20spend%20plan%20update%205-5-25%20for%20MAX%20collect%20%281%29.pdf
  {
    pattern: /(Repat Spend Plan|Repatriation)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202026_AmeriCorps%20and%20OMB%20Agreed%20Spend%20Plan.%20%282%29.pdf
  {
    pattern: /(^|[^a-z])AmeriCorps([^a-z]|$)/i,
    agency: 'Corporation for National and Community Service'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/PAD%20approved%20FY25%20Head%20Start%20Grantee_state%20table%20spend%20plan%20%281%29.pdf
  {
    pattern: /(^|[^a-z])head\s+start([^a-z]|$)/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FY%202026%20Refugee%20Resettlement%20Services%20Spend%20Plan%20%281%29.pdf
  {
    pattern: /Refugee\s+Resettlement\s+Services/i,
    agency: 'Department of Health and Human Services',
    bureau: 'Administration for Children and Families'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/ICE%20O%26S%20OBBBA%20Spend%20Plan%203.19.2026%20%281%29.pdf
  {
    pattern: /(^|[^a-z])ice([^a-z]|$)/i,
    agency: 'Department of Homeland Security',
    bureau: 'U.S. Immigration and Customs Enforcement'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/FLETC%20O%26S%20OBBBA%20spend%20plan%204.10.2026%20%281%29.pdf
  {
    pattern: /(^|[^a-z])FLETC([^a-z]|$)/i,
    agency: 'Department of Homeland Security'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/USCG%20PCI%20OBBBA%2004.08.2026%20%281%29.pdf
  {
    pattern: /(^|[^a-z])USCG([^a-z]|$)/i,
    agency: 'Department of Homeland Security',
    bureau: 'United States Coast Guard'
  },
  // https://apportionment-public.max.gov/Spend%20Plans/CBP%20O%26S%20Spend%20Plan%203-6-26%20%282%29.pdf
  {
    pattern: /(^|[^a-z])cbp([^a-z]|$)/i,
    agency: 'Department of Homeland Security',
    bureau: 'U.S. Customs and Border Protection'
  }
] as Array<{ pattern: RegExp; agency: string; bureau?: string; fiscalYear?: string }>;
