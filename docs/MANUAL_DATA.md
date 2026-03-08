# Manual data sources

To help supplement the data that is automatically collected by the system, we have a number of manual data sources that are used to provide additional context and information.

## Line descriptions

To help with searching and labeling, a manual dataset of [standardized line descriptions](https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=866) is maintained.

- `data/line-descriptions.ts`
  - Source is managed in [this spreadsheet](https://docs.google.com/spreadsheets/d/1uskF_xz6AL5XImEUoMCvghnC7y9EfCaRypeuod3BTHQ/edit?gid=1815332441#gid=1815332441).
  - If the spreadsheet is published to the web, you can get the data easily with a command like: `wget "https://docs.google.com/spreadsheets/d/e/2PACX-1vQcsSbcOaq9O3IglYpHZhPLkbZvqX-n1urvPOAVpUOylVhfmjIcGAOH2qluba-V2EiZBZuYtHRyua1k/pub?gid=1815332441&single=true&output=csv" -O data/meta/line-descriptions.csv`
  - Then convert to TS/JS file: `npm run csv-to-ts -- data/line-descriptions.csv data/line-descriptions.ts`
  - TODO: Given the build and image steps, referring to this file directly as a CSV is not ideal so, so converting to TS so that it is imported and handled correctly.

## Line types (sections)

The default set of line types is maintained in `data/line-types.ts`.

## OMB data fixes

Occasionally the data that comes through the OMB site is obviously incorrect, and it is necessary to manually fix it. These fixes are stored in the following files:

- `data/fixes/pdf-files.ts`: A JSON-ish file that contains update to PDF apportionments and spend plans. Will get run when collecting data.

## Spend Plan Agencies

Our spend plans are not organized or named with the conventions that other apportionments use. They often use agency acronyms in order to specify which agency the spend plan applies to. In order to square this with our budget agencies as defined in our apportionment records, we need to generate a reference data set.

- `data/agencyMatches.ts`
  - File is generated with the `npm run dev:check-agencies` command (not run automatically)
  - Pulls agencies from [The Federal Register's api endpoint](https://www.federalregister.gov/api/v1/agencies) that lists agency information
  - The script then compares these agencies' names with our budget agencies within our tafs records. It ranks the match based on similarity across the two names, and if the match is good enough, associates the top result to our budget agency or budget bureau. (For bureau, it also compares across the parent agency to improve the ranking accuracy).
  - This match is not always perfect, but more often than not does return the correct agency when provided.
  - The script also keeps track of orphaned agencies/bureaus (values within our tafs that do not have matches) and leftover agencies/bureaus (values returned by the api dataset that do not have matching tafs).
