/**
 * Runs through our agencies & bureaus and checks them against json reference
 * This allows our spend plan abbreviations to be converted to omb budget agencies/bureaus
 * already within the system
 *
 * This relies on agencies data retrieved from
 *  https://www.federalregister.gov/api/v1/agencies
 *  (more info here - https://www.federalregister.gov/developers/documentation/api/v1)
 */

// Dependencies
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { orderBy } from 'lodash-es';
import fs from 'node:fs';
import { Command } from 'commander';
import { agencies as getAgencies, bureaus as getBureaus } from '$db/queries/agencies';
import packageJson from '../package.json' assert { type: 'json' };

const filterWords = ['of', 'and', 'for', 'on', 'the'];

type AgencyApiResult = {
  id: number;
  name: string;
  short_name: string;
  slug: string;
  parent_id: number | null;
};

type BudgetAgency = {
  budgetAgencyTitle: string;
  budgetAgencyTitleId: string;
  budgetBureauTitle?: string;
  budgetBureauTitleId?: string;
};

type ComparisonResult = {
  id: AgencyApiResult['id'];
  name: AgencyApiResult['name'];
  comparing: BudgetAgency['budgetAgencyTitle'] | BudgetAgency['budgetBureauTitle'];
  rank: number;
  parent: AgencyApiResult['name'] | undefined;
  comparingParent:
    | BudgetAgency['budgetAgencyTitle']
    | BudgetAgency['budgetBureauTitle']
    | undefined;
};

type AgencyMatches = AgencyApiResult &
  BudgetAgency & {
    exact?: boolean;
    matchLevel?: ComparisonResult['rank'];
    matches?: Array<ComparisonResult>;
  };

function wordMatch(initialWord: string, comparisonWord: string) {
  const parts = initialWord?.split(' ').filter((p) => !filterWords.includes(p)) || [];
  return {
    same: parts.filter((p) => !!comparisonWord.includes(p)),
    extra: parts.filter((p) => !comparisonWord.includes(p))
  };
}

function buildAgencyComparison(
  agencies: Array<AgencyApiResult>,
  budgetAgency: BudgetAgency
): Array<ComparisonResult> {
  const results = agencies
    .map((agency) => {
      const comparing = budgetAgency.budgetBureauTitle || budgetAgency.budgetAgencyTitle;
      const parent = agencies.find((a) => a.id === agency.parent_id);

      const budgetMatch = wordMatch(comparing, agency.name);
      if (budgetMatch.same.length < 2) {
        return null;
      }
      const referenceMatch = wordMatch(agency.name, comparing);
      let budgetParentMatch, referenceParentMatch;
      if (budgetAgency.budgetBureauTitleId && parent) {
        budgetParentMatch = wordMatch(budgetAgency.budgetAgencyTitle, parent.name);
        referenceParentMatch = wordMatch(parent.name, budgetAgency.budgetAgencyTitle);
      }

      return {
        id: agency.id,
        name: agency.name,
        comparing,
        rank:
          Number(!!agency.parent_id === !!budgetAgency.budgetBureauTitleId) * 1 +
          (budgetMatch.same.length + referenceMatch.same.length) +
          (budgetMatch.extra.length + referenceMatch.extra.length) * -1 +
          ((budgetParentMatch?.same.length || 0) + (referenceParentMatch?.same.length || 0)) +
          ((budgetParentMatch?.extra.length || 0) + (referenceParentMatch?.extra.length || 0)) * -1,
        parent: parent?.name,
        comparingParent: budgetAgency.budgetBureauTitleId
          ? budgetAgency.budgetAgencyTitle
          : undefined
      };
    })
    .filter((match) => !!match && match.rank > 0);

  return orderBy(<Array<ComparisonResult>>results, 'rank', 'desc');
}

/**
 * Main CLI function
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Check our agencies/bureaus against data.')
    .parse(process.argv);

  const agencies: Array<AgencyApiResult> = await (
    await fetch('https://www.federalregister.gov/api/v1/agencies')
  ).json();

  const orphanAgencies: Array<BudgetAgency> = [];
  const agencyMatches: Array<AgencyMatches> = [];
  (await getAgencies()).forEach((agency) => {
    const match = agencies.find((a) => {
      return (
        (!a.parent_id && a.slug == agency.budgetAgencyTitleId) || a.name == agency.budgetAgencyTitle
      );
    });
    if (match) {
      agencyMatches.push({
        ...match,
        budgetAgencyTitle: agency.budgetAgencyTitle,
        budgetAgencyTitleId: agency.budgetAgencyTitleId,
        exact: true
      });
    }
    else {
      const comparisonResults = buildAgencyComparison(agencies, agency);
      if (comparisonResults.length) {
        agencyMatches.push({
          ...(<AgencyApiResult>agencies.find((a) => a.id === comparisonResults[0].id)),
          budgetAgencyTitle: agency.budgetAgencyTitle,
          budgetAgencyTitleId: agency.budgetAgencyTitleId,
          matchLevel: comparisonResults[0].rank,
          matches: comparisonResults
        });
      }
      else {
        orphanAgencies.push({
          ...agency,
          matches: comparisonResults
        });
      }
    }
  });

  const orphanBureaus: Array<BudgetAgency> = [];
  const bureauMatches: Array<AgencyMatches> = [];
  (await getBureaus()).forEach((bureau) => {
    const match = agencies.find((a) => {
      return (
        (!!a.parent_id && a.slug == bureau.budgetBureauTitleId) ||
        a.name == bureau.budgetBureauTitle
      );
    });
    if (match) {
      bureauMatches.push({
        ...match,
        budgetAgencyTitle: bureau.budgetAgencyTitle,
        budgetAgencyTitleId: bureau.budgetAgencyTitleId,
        budgetBureauTitle: bureau.budgetBureauTitle,
        budgetBureauTitleId: bureau.budgetBureauTitleId,
        exact: true
      });
    }
    else {
      const comparisonResults = buildAgencyComparison(agencies, bureau);
      if (comparisonResults.length) {
        bureauMatches.push({
          ...(<AgencyApiResult>agencies.find((a) => a.id === comparisonResults[0].id)),
          budgetAgencyTitle: bureau.budgetAgencyTitle,
          budgetAgencyTitleId: bureau.budgetAgencyTitleId,
          budgetBureauTitle: bureau.budgetBureauTitle,
          budgetBureauTitleId: bureau.budgetBureauTitleId,
          matchLevel: comparisonResults[0].rank,
          matches: comparisonResults
        });
      }
      else {
        orphanBureaus.push({
          ...bureau,
          matches: comparisonResults
        });
      }
    }
  });

  const leftoverAgencies = agencies.filter(
    (a) =>
      !a.parent_id &&
      !agencyMatches.find((b) => b.id === a.id) &&
      !bureauMatches.find((b) => b.id === a.id)
  );

  const leftoverBureaus = agencies.filter(
    (a) =>
      !!a.parent_id &&
      !agencyMatches.find((b) => b.id === a.id) &&
      !bureauMatches.find((b) => b.id === a.id)
  );

  console.log('Budget agencies matched:', agencyMatches.length);
  console.log('Budget agencies without match:', orphanAgencies.length);
  console.log('Leftover agencies:', leftoverAgencies.length);
  console.log('Budget bureaus matched:', bureauMatches.length);
  console.log('Budget bureaus without match:', orphanBureaus.length);
  console.log('Leftover bureaus:', leftoverBureaus.length);

  const matchData = `// Generated by bin/check-agencies.ts\n\nexport default ${JSON.stringify(
    {
      agencies: agencyMatches,
      bureaus: bureauMatches,
      orphanAgencies,
      orphanBureaus,
      leftoverAgencies,
      leftoverBureaus
    },
    null,
    2
  )};`;

  const _dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = joinPath(_dirname, '..', 'data', 'agencyMatches.ts');
  fs.writeFile(filePath, matchData, 'utf8', () => {
    console.log('Matches written to /data/agencyMatches.ts');
  });
}

cli();
