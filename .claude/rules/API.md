# API

RESTful API built with SvelteKit endpoints. Routes live under `src/routes/api/` in kebab-case.

## Response format

Success:

```json
{
  "query": {},
  "paging": {
    "page": 1,
    "offset": 0,
    "pages": 10,
    "size": 50,
    "count": 100
  },
  "results": []
}
```

Error:

```json
{
  "error": true,
  "status": 404,
  "message": "File not found"
}
```
