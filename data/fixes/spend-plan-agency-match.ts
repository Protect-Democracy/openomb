/**
 * Fixes for spend plans without agency abbreviation
 *
 * Matches agency/bureau on regex title convention instead
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
  }
] as Array<{ pattern: RegExp; agency: string; bureau?: string }>;
