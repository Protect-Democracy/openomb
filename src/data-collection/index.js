/**
 * Main functions for scraping data from OMB
 */

// Dependencies
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ensureDirSync } from 'fs-extra/esm';
import { parse as htmlParser } from 'node-html-parser';

// Constants
const OMB_BASE_URL = 'https://apportionment-public.max.gov/';
const SCRAPE_CACHE_TTL = 1000 * 60 * 60 * 24 * 3;
const SCRAPE_CACHE_DIR = './.cache/collection';


apportionmentData();


async function apportionmentData() {
  let list = await apportionmentList();

  for (const url of list) {
    // Handle JSON
    if (url.endsWith('.json')) {
      let file = await scraper(url, { expectedType: 'json' });

      // Footnote B1
      if (file.data?.FootnoteData[0]?.FootnoteNumber === 'B1') {
        console.log(url);
        console.log(file.data);
      }

      // Titles
      let agencyTitles = [ ...new Set(file.data?.ScheduleData?.map(d => d.BudgetAgencyTitle))];
      let bureauTitles = [ ...new Set(file.data?.ScheduleData?.map(d => d.BudgetBureauTitle))];
      let accountTitles = [ ...new Set(file.data?.ScheduleData?.map(d => d.AccountTitle))];
      if (agencyTitles.length > 1 || bureauTitles.length > 1 || accountTitles.length > 1) {
        console.log(url);
        console.log(agencyTitles, bureauTitles, accountTitles);
        console.log(file.data);
      }

      // Iteration
      let iterations = [ ...new Set(file.data?.ScheduleData?.map(d => d.Iteration))];
      if (iterations > 1) {
        console.log(url);
        console.log(iterations);
        console.log(file.data);
        sdfdssfd();
      }
    }
    else {

    }
  }

  return data;
}


/**
 * Get list of all apportionment URL/files (JSON, Excel, at least one PDF).
 *
 * @returns {Array} - List of links to JSON files
 */
async function apportionmentList() {
  let homepage = await scraper(OMB_BASE_URL, { expectedType: 'text' });

  // Check response
  if (!homepage.meta.response.ok || !homepage.data || homepage.meta.response.status >= 300) {
    throw new Error(`Homepage response was not valid | OK: ${homepage.meta.response.ok} | Status: ${homepage.meta.response.status}`);
  }

  // Get links in the section
  let parsedHtml = htmlParser(homepage.data);
  let links = parsedHtml.querySelectorAll('#hierarchy a').map(a => a.getAttribute('href'));

  // Add domain/url to relative links
  links = links.map(link => `${OMB_BASE_URL}${link.replace(/^\//, '')}`);

  return links;
}


/**
 * Create a wrapper around fetch to scrape and cache data from the OMB website.
 *
 * We do this ourselves so that we can save the data to disk in a specific way
 * to zip up later and create an archive if needed.
 *
 * @returns {object} - Returns object with:
 *   data - Response data, parsed if JSON.
 *   meta - Meta information about the request and if cache was hit.
 */
async function scraper(url, options = {}) {
  options.expectedType = options.expectedType || 'json';
  options.baseUrl = options.baseUrl || OMB_BASE_URL;
  options.ttl = options.ttl || SCRAPE_CACHE_TTL;
  options.cacheDir = options.cacheDir || SCRAPE_CACHE_DIR;
  options.cacheMissOnNot200 = options.cacheMissOnNot200 === false ? false : true;

  // Make sure cache location exists
  ensureDirSync(options.cacheDir);

  // Make key from URL
  let key = cacheKey(url, options.baseUrl);
  key = key || 'homepage';

  // Paths
  const cachePath = `${options.cacheDir}/${key}.data`;
  const cacheMeta = `${options.cacheDir}/${key}.meta`;

  // Check if there is a TTL (0 means don't use cache)
  if (options.ttl) {
    // Check for meta file
    let existingMeta = existsSync(cachePath) && existsSync(cacheMeta) ? JSON.parse(readFileSync(cacheMeta)) : {};

    // Use cache if not expired, or if not 200 and we want to miss on that
    const expired = existingMeta.expires && existingMeta.expires < Date.now();
    const cacheIs200 = options.cacheMissOnNot200 && existingMeta.response && existingMeta.response.status === 200;
    if (!expired && cacheIs200) {
      let data = options.expectedType === 'json' ? JSON.parse(readFileSync(cachePath)) : readFileSync(cachePath, 'utf8');
      let meta = {
        cacheHit: true,
        ...existingMeta
      };
      return { data, meta };
    }

    // Make fetch request
    const response = await fetch(url);
    const data = await response[options.expectedType]();

    // Meta
    const meta = {
      created: Date.now(),
      expires: Date.now() + options.ttl,
      response: responseForCache(response)
    };

    // Save to cache
    writeFileSync(cachePath, options.expectedType === 'json' ? JSON.stringify(data) : data);
    writeFileSync(cacheMeta, JSON.stringify(meta));

    return { data, meta: { cacheHit: false, ...meta }};
  }
  else {
    // Make fetch request and no save since TTL is nothing
    const response = await fetch(url);
    const data = await response[options.expectedType]();

    return {
      data,
      meta: {
        cacheHit: false,
        response: responseForCache(response)
      }
    };
  }
}

/**
 * URL to file cache key
 */
function cacheKey(url, baseUrl) {
  let transformed = url.replace(baseUrl, '');
  transformed = decodeURI(transformed);
  transformed = transformed
    .replace(/\//g, '---')
    .replace(/[^-a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  return transformed;
}


/**
 * Relevant response data to save for caching
 */
function responseForCache(response) {
  return {
    headers: Object.fromEntries(response.headers),
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  };
}

export {
  scraper,
  cacheKey
};
