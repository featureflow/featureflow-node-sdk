# SDK harness

Small Express app in `server.js` that uses `Featureflow.ExpressClient` and the built package in `../../dist/`.

```bash
FEATUREFLOW_SERVER_KEY=ff.srv.<your_key> yarn example:server
# Staging (uses SDK env support for baseUrl)
FEATUREFLOW_BASE_URL=https://beta.featureflow-staging.com FEATUREFLOW_SERVER_KEY=ff.srv.<your_key> yarn example:server
```

From the repo root, `yarn example:server` runs `yarn build` first, then starts the server. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for environment variables and endpoints.

This directory is for local development and is not published in the npm package (the package `files` field is `dist` only).
