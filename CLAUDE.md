# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Featureflow **server-side Node SDK**, published to npm as `featureflow-node-sdk`. It polls the Featureflow API for feature configuration, evaluates variants locally per user, and reports evaluation events. It is part of the multi-repo Featureflow workspace (see the parent directory's CLAUDE.md) — its wire protocol and bucketing algorithm must stay in sync with `event-server`, `sdk-server`, `featureflow-edge-proxy`, and the other SDKs.

## Commands

Uses **Yarn** (`.yarnrc.yml`, `nodeLinker: node-modules`). Never add or commit `package-lock.json`.

```bash
yarn install                 # CI uses yarn install --frozen-lockfile
yarn build                   # babel src -> dist (with source maps), then tsc emits .d.ts only
yarn test                    # cucumber tests, excluding @ignore and @integration
yarn test:integration        # @integration scenarios only — hits the live Featureflow API
yarn example:server          # manual Express harness (builds first); needs FEATUREFLOW_SERVER_KEY
```

Run a single feature file or scenario:

```bash
node_modules/.bin/cucumber-js --require-module babel-core/register features/rules.feature
node_modules/.bin/cucumber-js --require-module babel-core/register features/rules.feature:12   # by line
```

There is no lint step. CI (`.github/workflows/ci.yml`) runs `yarn ci-test` on a Node 10–20 matrix, so source and dependencies must stay compatible with old Node runtimes (`engines: node >4.0.0`).

## Build toolchain (unusual — read before touching)

- Source is plain JavaScript in `src/`, compiled with **Babel 6** (`.babelrc`: `es2015` + `stage-2` presets, flow-strip-types). This limits syntax to what those presets support — no optional chaining, nullish coalescing, or class private fields.
- TypeScript is **not** a source language here: `tsc` runs with `allowJs` + `emitDeclarationOnly` purely to generate `dist/*.d.ts` from the JS. The published package is `dist/` only.
- Tests are **Cucumber only** (`features/*.feature` + `features/step_definitions/`, world setup in `features/support/world.js`). There is no unit test framework; new behavior gets a scenario + step definitions. Step definitions import from `src/` via `babel-core/register`, so tests don't need a build first.
- `features/integration.feature` (`@integration`) instantiates a real client against production with a checked-in test API key; it's excluded from `yarn test` / CI.

## Architecture

Public API (`src/index.js`): `Client`, `UserBuilder`, `Feature`, `ExpressClient`.

`Client` (`src/Client.js`) extends EventEmitter and wires everything together:

- **Config**: `baseUrl` (default `https://app.featureflow.io`), `eventsUrl` (default `https://events.featureflow.io`), `apiKey` — each falls back to env vars `FEATUREFLOW_BASE_URL`, `FEATUREFLOW_EVENTS_URL`, `FEATUREFLOW_SERVER_KEY` when not passed in code. `disableEvents` (or `FEATUREFLOW_DISABLE_EVENTS`) turns off event reporting.
- **PollingClient** (`src/PollingClient.js`): GETs `{baseUrl}/api/sdk/v1/features` with `Authorization: Bearer <srv- key>` and `If-None-Match` ETag caching, populates the `InMemoryFeatureStore`. Polls every 20s by default (`config.interval` in seconds; `0` disables polling). `evaluate()`/`evaluateAll()` also call `maybeRefresh()` for lazy refresh when the interval has lapsed.
- **EventsClient** (`src/EventsClient.js`): queues evaluate events (cap 10,000) and flushes to `{eventsUrl}/api/sdk/v1/events` every 60s; `withFeatures` registrations go to `/api/sdk/v1/register`.
- **Evaluate** (`src/Evaluate.js`): the object returned by `client.evaluate(key, user)`. Its `is()/isOn()/isOff()/value()` methods both answer the check **and** emit an evaluate event — evaluation isn't recorded until one of them is called.
- **Failover**: unknown feature keys evaluate to the failover variant pre-registered via `config.withFeatures` (`Feature` builder), defaulting to `"off"`.

Evaluation logic lives in `src/EvaluateHelpers.js` + `src/Conditions.js`: first matching rule wins; rule audiences AND their conditions, a condition passes if any of the user's values for the target attribute satisfies the operator. Before matching, the user is augmented with implicit attributes `featureflow.user.id`, `featureflow.date`, and `featureflow.hourofday`.

**Variant bucketing must not change independently**: SHA-1 of `"1:featureKey:userId"`, first 15 hex chars, mod 100 + 1, walked against the rule's cumulative `variantSplits`. This is the workspace-wide algorithm shared with the servers and other SDKs.

## Manual harness and debugging

`examples/harness/server.js` is an Express app that loads the built SDK from `dist/` (so run `yarn build` after SDK changes — `yarn example:server` does this automatically). Endpoints: `/health`, `/api/config`, `/api/ready`, `/api/evaluate?feature=<key>&userId=<id>`; default port 3456. Copy `.env.example` to `.env` (gitignored) for keys/URLs; the `.vscode/launch.json` "Harness: example server" config loads it and source maps map breakpoints back to `src/`.

SDK logging uses the `debug` package under the `featureflow-node-sdk` namespace — set `DEBUG=featureflow-node-sdk` to see it (stderr).
