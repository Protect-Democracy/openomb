/**
 * Fixes for spend plans without agency abbreviation
 *
 * Matches agency/bureau on regex title convention instead
 */

export default [
  {
    pattern: /State (Diplomatic|Embassy|CIO)/,
    agency: 'Department of State'
  }
] as Array<{ pattern: RegExp; agency: string; bureau?: string }>;
