# featureflow-node-sdk

[![][npm-img]][npm-url]

[![CI](https://github.com/featureflow/featureflow-node-sdk/workflows/CI/badge.svg)](https://github.com/featureflow/featureflow-node-sdk/actions)

[![][dependency-img]][dependency-url]

> Featureflow Node SDK

Get your Featureflow account at [featureflow.io](http://www.featureflow.io)

# Contributor Guidelines

Featureflow SDKs are open source and we welcome contributions from all developers.


## Building

This project uses [Yarn](https://yarnpkg.com/) and **`yarn.lock`** for dependency resolution. Use Yarn for installs; do not add or commit `package-lock.json`.

```
# install dependencies
yarn install 
# build the SDK
yarn build 
# run tests including cucumber
yarn test 
```

## Manual test harness (example server)

After `yarn build`, you can run a small Express app that loads the SDK from `dist/` the same way an application would:

```
FEATUREFLOW_SERVER_KEY=ff.srv.<your_key> yarn example:server
```

- Defaults to `http://127.0.0.1:3456/` (override with `PORT`). The home page can trigger evaluations in the browser; JSON endpoints: `GET /health`, `GET /api/config`, `GET /api/ready`, `GET /api/evaluate?feature=<key>&userId=<id>`, `GET /api/evaluate-all?userId=<id>` (evaluates every feature in the store for that user).
- The harness turns off the events client by default (no calls to the events API). Set `FEATUREFLOW_DISABLE_EVENTS=false` to send evaluation events like a full production client.
- **Staging / custom app host:** the SDK reads `FEATUREFLOW_BASE_URL` (and optionally `FEATUREFLOW_EVENTS_URL`) when those values are not passed in code. Example:
  `FEATUREFLOW_BASE_URL=https://beta.featureflow-staging.com FEATUREFLOW_SERVER_KEY=ff.srv.<key> yarn example:server`

`yarn example:server` runs `yarn build` first so `dist/` is up to date.

## Debugging in Cursor / VS Code

- **Run and Debug** (or F5): use the **“Harness: example server”** configuration in [`.vscode/launch.json`](.vscode/launch.json). It runs `yarn build` first, then starts `examples/harness/server.js` with the integrated terminal.
- **Environment:** create a **`.env`** file in the repo root (see [`.env.example`](.env.example); `.env` is gitignored) with at least `FEATUREFLOW_SERVER_KEY` and optional `FEATUREFLOW_BASE_URL`. The launch config loads it via `envFile`.
- **SDK source:** `yarn build` emits **source maps** next to `dist/*.js`. When you break or step in code loaded from `dist/`, the debugger should open the matching file under **`src/`** (e.g. `src/Client.js`). Use **“Harness: example server (no pre-build)”** if you already built and want a faster start.
- If breakpoints stay “unbound”, run `yarn build` so `dist/` and `dist/*.map` exist, then restart the debug session.

**SDK log output:** internal messages use the [`debug`](https://www.npmjs.com/package/debug) module under the namespace `featureflow-node-sdk`. They go to **stderr** only when **`DEBUG`** includes that name, e.g. `DEBUG=featureflow-node-sdk` in `.env` (see [`.env.example`](.env.example)) or in the shell before `yarn example:server`.

## License

Apache-2.0

[npm-url]: https://nodei.co/npm/featureflow-node-sdk
[npm-img]: https://nodei.co/npm/featureflow-node-sdk.png

[dependency-url]: https://www.featureflow.io
[dependency-img]: https://www.featureflow.io/wp-content/uploads/2016/12/featureflow-web.png
