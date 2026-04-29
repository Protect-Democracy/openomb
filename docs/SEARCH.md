# Search

Given that we need to manage search through the UI and subscriptions, we have to be intentional about changes.

## Schema and main types

The saved search schema is defined in `$schema/searches.ts`. The criterion for searches is saved as a JSON type. This defines the database model and the search criterion types.

The `SavedSearchCriterion` defines the types of criteria that we want to save for a search. This should align with what is in the UI. Not that there is a `LegacySearchCriterion` type to help with older version sof storage.

## Methods

In the the `$lib/searches.ts` module, there are a number of important methods:

- `parseCriterion`: This is used to parse the criterion from different formats, into the `SavedSearchCriterion` type. This is used when dealing with search criterion data, either from the database, URL, form, etc.
- `parseUrlSearchParams`: This is used to parse the search criterion from URL search params, into the `SavedSearchCriterion` type. This is used when loading search criterion from the URL.
- `criterionToUrlSearchParams`: This is used to convert the `SavedSearchCriterion` type into URL search params. This is used when saving search criterion to the URL, or when generating links with search criterion in the URL.
- `searchCriterionDescriptions`: Used to generate human readable descriptions of search criterion, for display in the UI. Used in the filters on the search page, and in the saved searches list.

## Queries

The search queries are defined in `$queries/searches.ts`. These are used to query the database for searches, and to save searches to the database.

- `generalSearchFilters`: This is the main function that translates the `SavedSearchCriterion` into a set of filters that can be used in the database queries.

## Making changes

When making changes to the search criterion types, you should:

1. Update the `SavedSearchCriterion` type in `$schema/searches.ts` to reflect the new criterion types.
2. If necessary, update the `LegacySearchCriterion` type to reflect any changes in the old storage format.
3. Update the `parseCriterion` method in `$lib/searches.ts` to handle parsing the new criterion types from different formats.
4. Update the `parseUrlSearchParams`, `parseUrlSearchParams`, `searchCriterionDescriptions`
5. Update the `generalSearchFilters` function in `$queries/searches.ts` to handle translating the new criterion types into database filters.
6. May need to update logic in `getSubscriptionWithFiles` which translates subscription criterion into search criterion, and then uses the search filters to get the files for a subscription. This is in `$server/subscriptions.ts`.
