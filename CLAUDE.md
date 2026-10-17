# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Featureflow **server-side Node SDK**, published to npm as `featureflow-node-sdk`. It polls the Featureflow API for feature configuration, evaluates variants locally per user, and reports evaluation events. It is part of the multi-repo Featureflow workspace (see the parent directory's CLAUDE.md) — its wire protocol and bucketing algorithm must stay in sync with `sdk-server` (which serves all SDK traffic), `featureflow-edge-proxy`, and the other SDKs.

## Commands

Uses **Yarn 4** (`packageManager: yarn@4.4.1`, `.yarnrc.yml` with `nodeLinker: node-modules`). Never add or commit `package-lock.json`.

```bash
git submodule update --init  # the shared testbed scenarios live in the testbed/ submodule
yarn install                 # CI uses yarn install --immutable
yarn build                   # babel src -> dist (with source maps), then tsc emits .d.ts only
yarn test                    # cucumber: testbed/gherkin + features/gherkin, excluding @ignore and @integration
yarn test:integration        # @integration scenarios only — hits the live Featureflow API
yarn example:server          # manual Express harness (builds first); needs FEATUREFLOW_SERVER_KEY
```

Run a single feature file or scenario:

```bash
node_modules/.bin/cucumber-js --require-module @babel/register -r features/step_definitions -r features/support testbed/gherkin/rules.feature
node_modules/.bin/cucumber-js --require-module @babel/register -r features/step_definitions -r features/support testbed/gherkin/rules.feature:12   # by line
```

Without the submodule checked out, cucumber finds almost no feature files and passes vacuously — check the scenario count (160+).

There is no lint step. CI (`.github/workflows/ci.yml`) installs once on Node 20, then runs `npm run ci-test` on a Node 10–20 matrix, so source and runtime dependencies must stay compatible with Node 10 (`engines: node >=10.0.0`).

## Build toolchain (unusual — read before touching)

- Source is plain JavaScript in `src/`, compiled with **Babel 7** (`babel.config.json`: `@babel/preset-env` targeting Node 10). Modern syntax is transpiled, but runtime APIs must exist on Node 10.
- TypeScript is **not** a source language here: `tsc` runs with `allowJs` + `emitDeclarationOnly` purely to generate `dist/*.d.ts` from the JS, so most declared types are `any`. The published package is `dist/` only (source maps excluded).
- Tests are **Cucumber only**. Shared cross-SDK scenarios are in `testbed/gherkin/` (the `featureflow-sdk-testbed` submodule — change them there, not here); Node-only scenarios are in `features/gherkin/`. Step definitions in `features/step_definitions/`, world setup in `features/support/`. There is no unit test framework; new behaviour gets a scenario + step definitions. Step definitions import from `src/` via `@babel/register`, so tests don't need a build first.
- `features/integration.feature` (`@integration`) instantiates a real client against production with a checked-in test API key; it's excluded from `yarn test` / CI.

## Release

npm trusted publishing on GitHub release (`.github/workflows/publish.yml`, tag `vX.Y.Z` must match `package.json`). Use the `/sdk-release node` skill; `ops/development/sdk-publishing.md` is the reference. The npm page only shows a new README after a release.

## Architecture

Public API (`src/index.js`): `Client`, `UserBuilder`, `Feature`, `ExpressClient`.

`Client` (`src/Client.js`) extends EventEmitter and wires everything together:

- **Config**: `baseUrl` (default `https://app.featureflow.io`), `eventsUrl` (default `https://events.featureflow.io`), `apiKey` — each falls back to env vars `FEATUREFLOW_BASE_URL`, `FEATUREFLOW_EVENTS_URL`, `FEATUREFLOW_SERVER_KEY` when not passed in code. `application` falls back to `FEATUREFLOW_APPLICATION`. `disableEvents: true` turns off event reporting (config only — `FEATUREFLOW_DISABLE_EVENTS` is read by the example harness, not the SDK).
- **PollingClient** (`src/PollingClient.js`): GETs `{baseUrl}/api/sdk/v1/features` with `Authorization: Bearer <sdk-srv-env- key>` and `If-None-Match` ETag caching, populates the `InMemoryFeatureStore`. Polls every 20s by default (`config.interval` in seconds; values ≤ 5 are ignored, `0` disables polling). `evaluate()`/`evaluateAll()` also call `maybeRefresh()` for lazy refresh when the interval has lapsed. Server-driven SDK config (`X-Featureflow-Sdk-Config` header) can retune the poll interval.
- **EventsClient** (`src/EventsClient.js`): summarises evaluate events per (featureKey, variant) and flushes them with goal events to `{eventsUrl}/api/sdk/v1/events` every 60s (server config can change the interval or mode); `withFeatures` registrations go to `/api/sdk/v1/register`. `close()` stops the timer without flushing.
- **Evaluate** (`src/Evaluate.js`): the object returned by `client.evaluate(key, user)`. Its `is()/isOn()/isOff()/value()/jsonValue()` methods both answer the check **and** record an evaluate event (and fire the client's `evaluation` emitter event) — evaluation isn't recorded until one of them is called. `evaluateAll()` records nothing.
- **Failover**: unknown feature keys evaluate to the failover variant pre-registered via `config.withFeatures` (`Feature` builder), defaulting to `"off"`.

Evaluation logic lives in `src/EvaluateHelpers.js` + `src/Conditions.js`: first matching rule wins; rule audiences AND their conditions, a condition passes if any of the user's values for the target attribute satisfies the operator. Operators fail closed (an invalid `matches` regex is a no-match, never a throw). Before matching, the user is augmented with implicit attributes `featureflow.user.id`, `featureflow.date`, and `featureflow.hourofday`.

**Variant bucketing must not change independently**: SHA-1 of `"1:featureKey:userId"`, first 15 hex chars, mod 100 + 1, walked against the rule's cumulative `variantSplits`. This is the workspace-wide algorithm shared with the servers and other SDKs.

## Manual harness and debugging

`examples/harness/server.js` is an Express app that loads the built SDK from `dist/` (so run `yarn build` after SDK changes — `yarn example:server` does this automatically). Endpoints: `/health`, `/api/config`, `/api/ready`, `/api/evaluate?feature=<key>&userId=<id>`, `/api/evaluate-all?userId=<id>`; default port 3456. It disables events unless `FEATUREFLOW_DISABLE_EVENTS=false`. Copy `.env.example` to `.env` (gitignored) for keys/URLs; the `.vscode/launch.json` "Harness: example server" config loads it and source maps map breakpoints back to `src/`. For automated testing use the `autot` environment's keys, never production.

SDK logging uses the `debug` package under the `featureflow-node-sdk` namespace — set `DEBUG=featureflow-node-sdk` to see it (stderr).
