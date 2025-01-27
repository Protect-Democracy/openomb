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

- `data/fixes/pdf-files.ts`: A JSON-ish file that contains update to PDF apportionments. Will get run when collecting data.
