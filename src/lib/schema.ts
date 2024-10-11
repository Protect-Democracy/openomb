import type {
  Dataset,
  Organization,
  Thing,
  WebPage,
  WithContext,
  GovernmentOrganization,
  SearchAction
} from 'schema-dts';
import { siteName, siteDescription, siteKeywords, deployedBaseUrl } from '$config';
import { isArray } from 'lodash-es';
import { formatFileTitle, formatTafsFormattedId } from './formatters';
import type { filesSelect } from '$db/schema/files';
import type { tafsSelect } from '$db/schema/tafs';
import pdLogo from '$assets/logos/pd-white-words-logo.svg';

// General schema handler
type Schema = Thing | WithContext<Thing>;

// Constants
const ombSchema: GovernmentOrganization = {
  '@type': 'GovernmentOrganization',
  name: 'Office of Management and Budget',
  url: 'https://www.whitehouse.gov/omb/'
};

const pdSchema: Organization = {
  '@type': 'Organization',
  '@id': 'https://protectdemocracy.org/#organization',
  name: 'Protect Democracy',
  logo: {
    '@type': 'ImageObject',
    image: `${deployedBaseUrl}${pdLogo}`,
    caption: 'Protect Democracy logo'
  },
  nonprofitStatus: 'https://schema.org/Nonprofit501c3',
  url: 'https://protectdemocracy.org/'
};

const searchAction: SearchAction = {
  '@type': 'SearchAction',
  target: `${deployedBaseUrl}search?term={query}`,
  query: 'required'
};

/**
 * Generates schema for project/homepage
 */
export function projectSchema(): Organization {
  return {
    '@type': 'Project',
    name: siteName,
    parentOrganization: pdSchema,
    description: siteDescription,
    keywords: siteKeywords,
    potentialAction: [searchAction]
  };
}

/**
 * Generates schema for general pages
 */
export function pageSchema(data: {
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ title: string; url: string }>;
  includeSearch?: boolean;
}): WebPage {
  // https://schema.org/WebPage
  const schema: WebPage = {
    '@type': 'WebPage',
    name: data?.title || siteName,
    description: data?.description || siteDescription,
    author: projectSchema(),
    inLanguage: 'en-US'
  };

  if (data?.breadcrumbs?.length) {
    schema.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: data.breadcrumbs?.map((b, index) => ({
        '@type': 'ListItem',
        position: index,
        name: b.title,
        item: `${deployedBaseUrl}${b.url}`
      })),
      numberOfItems: data.breadcrumbs?.length
    };
  }

  if (data?.includeSearch) {
    schema.potentialAction = [searchAction];
  }

  return schema;
}

/**
 * Generates schema for File pages
 */
export function fileSchema(
  file: filesSelect & {
    tafs?: Array<tafsSelect>;
  }
): Dataset {
  // https://developers.google.com/search/docs/appearance/structured-data/dataset
  // https://schema.org/Dataset
  const schema: Dataset = {
    '@type': 'Dataset',
    '@id': `${deployedBaseUrl}/file/${file.fileId}`,
    name: formatFileTitle(file) || file.fileId,
    description: `Apportionment file ${file.fileId} retrieved from OMB public records`,
    url: `${deployedBaseUrl}/file/${file.fileId}`,
    author: projectSchema(),
    // https://github.com/schemaorg/schemaorg/issues/2311
    isBasedOn: {
      '@type': 'Dataset',
      name: file.sourceUrl,
      url: file.sourceUrl,
      maintainer: ombSchema
    },
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    datePublished: file.approvalTimestamp?.toISOString(),
    dateCreated: file.createdAt?.toISOString(),
    dateModified: file.modifiedAt?.toISOString(),
    hasPart: file.tafs?.map((t) => ({
      '@type': 'Dataset',
      name: `${formatTafsFormattedId(t) || t.tafsId} - ${t.accountTitle}`,
      description: `${t.accountTitle} account, Iteration ${t.iteration}, Fiscal year ${t.fiscalYear}`,
      url: `${deployedBaseUrl}/file/${file.fileId}#tafs_${t.tafsTableId}`
    }))
  };

  if (file.excelUrl) {
    (schema.sameAs as Array<string>).push(file.excelUrl);
  }
  if (file.pdfUrl) {
    (schema.sameAs as Array<string>).push(file.pdfUrl);
  }

  return schema;
}

export function formatJsonLdScript(schema: Schema) {
  // Need the @context, and Safari doesn't like top-level arrays.
  if (isArray(schema)) {
    schema = {
      '@context': 'http://schema.org',
      '@graph': schema
    };
  }
  else {
    schema['@context'] = 'https://schema.org';
  }

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
