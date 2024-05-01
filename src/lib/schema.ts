import type { Dataset, Organization, Thing, WebPage, WithContext } from 'schema-dts';
import { siteName, siteDescription, siteKeywords, deployedBaseUrl } from '$config';
import { formatFileTitle, formatTafsFormattedId } from './formatters';
import type { filesSelect } from '$db/schema/files';
import type { tafsSelect } from '$db/schema/tafs';
import pdLogo from '$assets/logos/pd-white-words-logo.svg';

type Schema = Thing | WithContext<Thing>;

export function projectSchema(): Organization {
  return {
    '@type': 'Project',
    name: siteName,
    parentOrganization: {
      '@type': 'EducationalOrganization',
      name: 'Protect Democracy',
      logo: {
        '@type': 'ImageObject',
        image: pdLogo,
        caption: 'Protect Democracy'
      },
      nonprofitStatus: 'https://schema.org/Nonprofit501c3',
      url: 'https://protectdemocracy.org/'
    },
    description: siteDescription,
    keywords: siteKeywords
  };
}

export function pageSchema(data: {
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ title: string; url: string }>;
  includeSearch?: boolean;
}): WebPage {
  const schema: WebPage = {
    '@type': 'WebPage',
    name: data.title || siteName,
    description: data.description || siteDescription,
    provider: projectSchema()
  };

  if (data.breadcrumbs?.length) {
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

  if (data.includeSearch) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${deployedBaseUrl}/search?term={search_term_string}`
      },
      query: 'required name=search_term_string'
    };
  }

  return schema;
}

export function fileSchema(
  file: filesSelect & {
    tafs?: Array<tafsSelect>;
  }
): Dataset {
  const schema: Dataset = {
    '@type': 'Dataset',
    name: formatFileTitle(file) || file.fileId,
    description: `Apportionment file ${file.fileId} retrieved from OMB public records`,
    url: `${deployedBaseUrl}/file/${file.fileId}`,
    sameAs: [file.sourceUrl],
    creator: 'https://apportionment-public.max.gov/',
    maintainer: projectSchema(),
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
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
