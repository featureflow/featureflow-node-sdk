# Change log
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
