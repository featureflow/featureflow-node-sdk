# Change log
## [Unreleased]
### Changed
- Evaluate events are now summarised client-side before sending: the SDK keeps one pending entry per `(featureKey, variant)` pair with an impression count instead of queueing a raw event per evaluation, and flushes summed impressions every interval. High-traffic evaluation payloads shrink from one row per call to one row per feature/variant.
- Each distinct user is sent at most once per flush interval (LRU of the last 1,000 user ids); the server still receives every distinct user's attributes, without the payload repeating the user on every evaluation.
- The `expectedVariant` field is no longer sent on evaluate events (the server never read it).
- The pending-event cap now bounds distinct feature/variant entries (10,000) rather than raw events; impressions for already-tracked entries are still counted when the cap is reached.

### Added
- Optional `FEATUREFLOW_BASE_URL` and `FEATUREFLOW_EVENTS_URL` when `baseUrl` / `eventsUrl` are not set in the client config; values are normalized (trailing slashes removed).
- Event sending now responds to server signals: a `401`/`403` from the events endpoint permanently disables event sending for the client's lifetime, and a `429` requeues the batch and backs off for `Retry-After` seconds (default 60).

### Changed
- `evaluateAll()` no longer records an evaluation event per feature. Bulk snapshots (e.g. bootstrapping a client-side SDK) previously emitted one event per feature per call; impressions are now only recorded via `evaluate()` when `is()`/`isOn()`/`isOff()`/`value()`/`jsonValue()` is called.
- `interval: 0` now fully disables feature refreshing: previously it disabled the polling timer but every `evaluate()`/`evaluateAll()` still triggered a lazy features request.

### Fixed
- Exceeding the event queue capacity threw a `ReferenceError` from the overflow log line instead of logging and dropping the event.

## [0.6.12] - 2024-09-12
### Do not poll with invalid API Key
## [0.6.11] - 2024-01-14
### Close Events Client
## [0.6.10] - 2024-01-13
### Close Events Client
## [0.6.8] - 2023-01-20
### Minor Fixes
## [0.6.6] - 2022-04-4
### Bug Fixes
### Polling optimisation
## [0.6.5] - 2019-05-01
### Bug Fixes
## [0.6.4] - 2018-012-18
### Changed
- Simplify express middleware
- Update url to events.featureflow.io for events
- Improve polling time
- Update readme
## [0.5.5] - 2017-07-14
### Changed
- Updated tests
## [0.5.4] - 2017-07-14
### Changed
- Added baseUrl config option, added `featureflow.ready(function(){})` callback
### Fixed
- Issue with offVariantKey
## [0.5.2] - 2017-07-10
### Changed
- Fix support for `var Featureflow = require('featureflow-node-sdk')`, previously was on `Featureflow.default`
## [0.5.0] - 2017-06-30
### Breaking Changes
- Entire api rewritten to follow closer to other SDK implementations.
## [0.3.0] - 2017-04-13
### Changed
- `Featureflow.init()` now returns the client, and the callback is optional. You can listen to `Featureflow.events.INIT` and `Featureflow.events.UPDATED` separately using `featureflow.on(event, callback)`.
- Added new events `Featureflow.events.INIT` and `Featureflow.events.UPDATED_VERBOSE`.
### Fixed
- `Featureflow.events.INIT` now fires before `Featureflow.events.UPDATED`
## [0.1.3] - 2017-03-21
### Changed
- Added `Featureflow.events.UPDATED` and `Featureflow.events.ERROR` constants for usage with `featureflow.on(event, callback)`. 
## [0.1.2] - 2017-03-21
### Changed
- `featureflow.close()` added to close connection with **featureflow.io**.
## [0.1.1] - 2017-03-21
### Changed
- `Featureflow.init(config, callback)` now starts up with the feature values passed in with `config.withFeatures` 
  and corresponding failoverVariants if your app is not able to connect to **featureflow.io**.
- Callback now only fires once per call to `Featureflow.init(...)`
## [0.1.0] - 2017-03-20
### Changed
- Initial Build

