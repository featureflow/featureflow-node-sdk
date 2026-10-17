# featureflow-node-sdk

[![npm](https://img.shields.io/npm/v/featureflow-node-sdk.svg)](https://www.npmjs.com/package/featureflow-node-sdk)
[![CI](https://github.com/featureflow/featureflow-node-sdk/workflows/CI/badge.svg)](https://github.com/featureflow/featureflow-node-sdk/actions)

The [Featureflow](https://www.featureflow.com) SDK for server-side Node.js.

The client downloads your environment's feature rules, keeps them in memory and evaluates flags
locally for any user you pass in, so an evaluation is a rule match rather than a network call.
Rules are refreshed in the background, and changes you make in the
[Featureflow dashboard](https://app.featureflow.com) reach your application without a redeploy.

- **Full documentation:** [docs.featureflow.io/nodejs-sdk](https://docs.featureflow.io/nodejs-sdk)
- **Change log:** [CHANGELOG.md](https://github.com/featureflow/featureflow-node-sdk/blob/main/CHANGELOG.md)
- **Sign up:** [featureflow.com](https://www.featureflow.com)

This SDK uses a **server** SDK key (`sdk-srv-env-…`). The key is secret, because it downloads the
whole ruleset for the environment, so keep it in server processes only. For browser code use the
[JavaScript client](https://docs.featureflow.io/javascript-client), and for React components the
[React client](https://docs.featureflow.io/reactjs-client).

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Defining a user](#defining-a-user)
- [Evaluating features](#evaluating-features)
- [JSON configuration values](#json-configuration-values)
- [Evaluating all features](#evaluating-all-features)
- [Tracking goals](#tracking-goals)
- [Reacting to feature changes](#reacting-to-feature-changes)
- [Forwarding evaluations to analytics tools](#forwarding-evaluations-to-analytics-tools)
- [Pre-registering features and failover variants](#pre-registering-features-and-failover-variants)
- [Naming your application](#naming-your-application)
- [Express](#express)
- [Shutting down](#shutting-down)
- [Debug logging](#debug-logging)
- [API reference](#api-reference)
- [Examples](#examples)

## Installation

```bash
npm install --save featureflow-node-sdk
```

Requires Node.js 10 or later. Type declarations are included.

## Quick start

```javascript
const Featureflow = require('featureflow-node-sdk');

const featureflow = new Featureflow.Client({ apiKey: 'sdk-srv-env-YOUR_API_KEY' });

featureflow.ready(() => {
  const user = new Featureflow.UserBuilder('user-123')
    .withAttribute('country', 'US')
    .build();

  if (featureflow.evaluate('my-feature-key', user).isOn()) {
    // new code path
  }
});
```

ES modules / TypeScript:

```typescript
import Featureflow from 'featureflow-node-sdk';

const featureflow = new Featureflow.Client({ apiKey: process.env.FEATUREFLOW_SERVER_KEY });
```

The package exports `Featureflow.Client`, `Featureflow.UserBuilder`, `Featureflow.Feature` and
`Featureflow.ExpressClient`.

> **Create the client once and share it.** It holds the ruleset and the polling and event timers;
> creating one per request re-downloads every feature each time.

### Waiting until features are loaded

The client can be used straight away, but until the first download completes every feature
evaluates to its failover variant (`'off'` unless you
[pre-register](#pre-registering-features-and-failover-variants) another). To wait for the
rules, pass a callback or use `ready()`:

```javascript
// Option 1: constructor callback
new Featureflow.Client({ apiKey: 'sdk-srv-env-YOUR_API_KEY' }, (error, featureflow) => {
  // featureflow is ready
});

// Option 2: ready()
const featureflow = new Featureflow.Client({ apiKey: 'sdk-srv-env-YOUR_API_KEY' });
featureflow.ready(() => {
  // featureflow is ready
});
```

The callback runs once the first request finishes, whether it succeeded or not. The request times
out after 5 seconds, so startup never waits longer than that. If no API key is configured, the
constructor callback is called with an `Error` and no features are fetched.

## Configuration

All options are optional except the API key, which can also come from the environment.

| Option | Environment variable | Default | Description |
|---|---|---|---|
| `apiKey` | `FEATUREFLOW_SERVER_KEY` | — | Server SDK key (`sdk-srv-env-…`) for the environment. |
| `application` | `FEATUREFLOW_APPLICATION` | none | Name of this workload. See [Naming your application](#naming-your-application). |
| `withFeatures` | — | `[]` | Features to pre-register with failover variants. See [below](#pre-registering-features-and-failover-variants). |
| `interval` | — | `20` | Seconds between rule refreshes. Values of 5 or less are ignored; `0` turns refreshing off after the first load. |
| `disableEvents` | — | `false` | `true` stops the client sending evaluation, goal and registration events. Evaluation still works. |
| `baseUrl` | `FEATUREFLOW_BASE_URL` | `https://app.featureflow.io` | Host the feature rules are fetched from. Only change this if you've been given a different endpoint. |
| `eventsUrl` | `FEATUREFLOW_EVENTS_URL` | `https://events.featureflow.io` | Host events are sent to. |

With the key in the environment, no config object is needed:

```bash
export FEATUREFLOW_SERVER_KEY=sdk-srv-env-YOUR_API_KEY
```

```javascript
const featureflow = new Featureflow.Client();
```

Values passed in code take precedence over environment variables.

## Defining a user

Featureflow targets rules and splits rollouts by user. A user has an `id`, which must uniquely
identify them (percentage rollouts hash it, so the same id always gets the same variant), and
optional attributes to target on.

```javascript
// With attributes
const user = new Featureflow.UserBuilder('user-123')
  .withAttribute('country', 'US')
  .withAttribute('tier', 'gold')
  .withAttributes('roles', ['USER_ADMIN', 'BETA_CUSTOMER'])
  .build();

// Or just the id
const user = 'user-123';
```

An attribute can hold a single value or an array. A targeting condition passes if any of the
attribute's values satisfies it. `UserBuilder` throws if the id is missing or empty.

The SDK also sets these attributes for you, so you can target on them without passing them:

| Attribute | Value |
|---|---|
| `featureflow.user.id` | The user's id |
| `featureflow.date` | The current time (ISO 8601) |
| `featureflow.hourofday` | The current hour of the day |

## Evaluating features

`evaluate(featureKey, user)` returns an evaluation. Read the variant from it with one of:

```javascript
const evaluation = featureflow.evaluate('my-feature-key', user);

evaluation.isOn();        // true if the variant is 'on'
evaluation.isOff();       // true if the variant is 'off'
evaluation.is('red');     // true if the variant is 'red'
evaluation.value();       // the variant key, e.g. 'red'
evaluation.jsonValue();   // the variant's JSON configuration value, or undefined
```

Reading the variant is what records an evaluation (an impression) in Featureflow's statistics.
Calling `evaluate()` without reading the result records nothing.

A feature key that doesn't exist in the environment evaluates to its failover variant: `'off'`,
or whatever you [pre-registered](#pre-registering-features-and-failover-variants).

## JSON configuration values

_Requires `featureflow-node-sdk` 0.7.0 or later._

A variant can carry a
[JSON configuration value](https://docs.featureflow.io/manage-feature-variants#json-configuration-values)
set in the dashboard, so a flag can deliver settings as well as an on/off decision. Read it with
`jsonValue()`:

```javascript
const config = featureflow.evaluate('checkout-theme', user).jsonValue();

if (config) {
  applyTheme(config.color, config.layout);
}
```

`jsonValue()` returns `undefined` when the resolved variant has no JSON value, including when the
feature isn't loaded and the failover variant is used, so always provide a fallback. It works
alongside the other methods, which keep returning or comparing the variant key:

```javascript
const evaluation = featureflow.evaluate('checkout-theme', user);

if (evaluation.isOn()) {
  const config = evaluation.jsonValue(); // e.g. { color: '#0066cc', maxItems: 10 }
}
```

Only the variant key is ever sent back to Featureflow in events, never the JSON payload.

## Evaluating all features

`evaluateAll(user)` returns an object mapping every loaded feature key to its variant key for
that user:

```javascript
const variants = featureflow.evaluateAll(user);
// { 'my-feature-key': 'on', 'checkout-theme': 'blue', ... }
```

It does **not** record evaluations, which makes it suitable for bulk snapshots such as
bootstrapping a client-side SDK. Use `evaluate()` for reads you want counted.

## Tracking goals

_Requires 0.7.0 or later._

Record goal (conversion or metric) events for experiments and metric-gated rollouts. The optional
third argument is a number, the metric value, or an object with an optional numeric `value` plus
any custom fields (the same shape as the OpenFeature tracking API):

```javascript
featureflow.track('signup', user);
featureflow.track('checkout-value', user, 129.90);
featureflow.track('purchase', user, { value: 129.90, plan: 'pro' });
```

Fire the goal where the conversion happens, for every variant including the control. Goal events
are batched and sent with evaluation events. See [A/B testing](https://docs.featureflow.io/ab-testing).

## Reacting to feature changes

_Requires 0.7.0 or later._

The client emits `updated` whenever a refresh finds changed feature rules. Listen for it if you
cache anything derived from a flag:

```javascript
featureflow.on('updated', () => {
  // feature rules changed — refresh anything you cached
});
```

## Forwarding evaluations to analytics tools

_Requires 0.9.0 or later._

The client emits `evaluation` each time you read a variant with `value()`, `is()`, `isOn()`,
`isOff()` or `jsonValue()`. Featureflow counts an impression on exactly the same calls, so the
number of events your tool receives matches the impression count in Featureflow. The event
contains `{ key, variant, value, user }`, where `value` is the variant's JSON value, if any.

Use it to send exposures to any analytics or experimentation tool. Server-side you know which of
your ids is the analytics user id, so map it explicitly:

```javascript
featureflow.on('evaluation', ({ key, variant, user }) => {
  // e.g. Amplitude, Segment, PostHog, Mixpanel or your own event bus
  analytics.track({ event: '$exposure', user_id: user, properties: { flag_key: key, variant } });
});
```

- The event fires once per recorded read, not once per flag, so a busy server fires it often.
  Batch or dedupe in your listener to suit your tool's billing (for example, keep a small `Set`
  of `user:key:variant`).
- A listener that throws is logged and ignored. It can't break flag evaluation.

## Pre-registering features and failover variants

Pre-register features your code depends on so they have a sensible value before the rules load,
if Featureflow can't be reached, or before the feature has been created in the dashboard. The
failover variant is what the feature evaluates to when there are no rules for it. Without one,
it's `'off'`.

```javascript
const featureflow = new Featureflow.Client({
  apiKey: 'sdk-srv-env-YOUR_API_KEY',
  withFeatures: [
    new Featureflow.Feature('key-one', 'on').build(),
    new Featureflow.Feature('key-two').build(),            // failover 'off'
    new Featureflow.Feature('key-three', 'custom').build(),
  ]
});

// Before these features exist in Featureflow:
featureflow.evaluate('key-one', user).isOn();          // true
featureflow.evaluate('key-two', user).isOff();         // true
featureflow.evaluate('key-three', user).is('custom');  // true
```

Pre-registered features are also reported to Featureflow, so they show up in your project. To
register a feature with variants other than `on` and `off`, add them before building:

```javascript
new Featureflow.Feature('checkout-theme', 'blue')
  .addVariant('blue')
  .addVariant('green')
  .build();
```

## Naming your application

_Requires 0.8.0 or later._

Optionally name this workload so the dashboard can attribute SDK usage and flag evaluations to it
(**Admin → SDKs**, and the "Evaluated by" panel on each feature's statistics tab):

```javascript
const featureflow = new Featureflow.Client({
  apiKey: 'sdk-srv-env-YOUR_API_KEY',
  application: 'checkout-api'
});
```

The name is a slug: lowercase letters, numbers, `.`, `_` and `-`, up to 64 characters. Uppercase
is lowercased; any other invalid value is dropped with a debug warning and no name is sent. The
`FEATUREFLOW_APPLICATION` environment variable is used when the option isn't set in code. See
[Application tags](https://docs.featureflow.io/application-tags).

## Express

Create the client once at startup and use it in your handlers:

```javascript
const express = require('express');
const Featureflow = require('featureflow-node-sdk');

const app = express();
const featureflow = new Featureflow.Client({ apiKey: 'sdk-srv-env-YOUR_API_KEY' });

app.get('/', (req, res) => {
  const user = new Featureflow.UserBuilder(req.user.id)
    .withAttribute('plan', req.user.plan)
    .build();

  res.render(featureflow.evaluate('new-homepage', user).isOn() ? 'homepage-new' : 'homepage');
});

featureflow.ready(() => app.listen(3000));
```

Alternatively, `Featureflow.ExpressClient(config)` is middleware that creates the client on the
first request, waits for it to load, and attaches it as `req.featureflow`:

```javascript
app.use(Featureflow.ExpressClient({ apiKey: 'sdk-srv-env-YOUR_API_KEY' }));

app.get('/', (req, res) => {
  const enabled = req.featureflow.evaluate('new-homepage', req.user.id).isOn();
  // ...
});
```

See the full [Express example](https://github.com/featureflow/featureflow-node-example).

## Shutting down

`close()` stops the refresh and event timers so your process can exit:

```javascript
featureflow.close();
```

Events still waiting for the next send (every 60 seconds by default) are not sent when you close
the client.

## Debug logging

The SDK logs through the [`debug`](https://www.npmjs.com/package/debug) package under the
`featureflow-node-sdk` namespace. To see its output on stderr:

```bash
DEBUG=featureflow-node-sdk node app.js
```

## API reference

### `Featureflow.Client`

| Member | Description |
|---|---|
| `new Client(config?, callback?)` | Create a client. See [Configuration](#configuration). `callback(error, client)` runs once the first load finishes. |
| `ready(callback)` | Run `callback(null, client)` once the first load has finished (immediately if it already has). |
| `evaluate(featureKey, user)` | Evaluate a feature for a user. Returns an evaluation (below). |
| `evaluateAll(user)` | Map every loaded feature key to its variant key. Records no evaluations. |
| `track(goalKey, user, details?)` | Record a goal event. `details` is a number or `{ value?, ...fields }`. |
| `on('updated', fn)` | Feature rules changed. |
| `on('evaluation', fn)` | An evaluation was recorded: `{ key, variant, value, user }`. |
| `close()` | Stop refreshing and sending events. |

`user` is either a user built with `UserBuilder` or a user id string.

### Evaluation

| Method | Returns |
|---|---|
| `isOn()` | `true` if the variant is `'on'` |
| `isOff()` | `true` if the variant is `'off'` |
| `is(variantKey)` | `true` if the variant is `variantKey` |
| `value()` | The variant key as a string |
| `jsonValue()` | The variant's JSON configuration value, or `undefined` |

### `Featureflow.UserBuilder`

| Method | Description |
|---|---|
| `new UserBuilder(id)` | Start a user. Throws if `id` is missing or empty. |
| `withAttribute(key, value)` | Set an attribute to a value or an array of values. |
| `withAttributes(key, values)` | Same as `withAttribute`, for array values. |
| `build()` | Build the user. |

### `Featureflow.Feature`

| Method | Description |
|---|---|
| `new Feature(key, failoverVariant = 'off')` | Start a feature to pre-register. |
| `addVariant(key)` | Add a variant. Fewer than two variants means the default `on` / `off`. |
| `build()` | Build the feature for `withFeatures`. |

## Examples

- [Express](https://github.com/featureflow/featureflow-node-example)
- [Next.js](https://github.com/featureflow/featureflow-example-nextjs)
- [Five-minute test](https://github.com/featureflow/featureflow-fiveminute-node)
  ([guide](https://docs.featureflow.io/nodejs-5minute))

## Contributing

Clone the repo, then install and run scripts with Yarn. See [CONTRIBUTING.md](CONTRIBUTING.md),
including the local Express test harness (`FEATUREFLOW_SERVER_KEY=… yarn example:server`).

## License

Apache-2.0
