# Change log
## [0.1.2] - 2017-03-21
### Changed
- `featureflow.close()` added to close connection with **featureflow.io**.
## [0.1.1] - 2017-03-21
### Changed
- `Featureflow.init(config, callback)` now starts up with the feautre values passed in with `config.withFeatures` 
  and corresponding failoverVariants if your app is not able to connect to **featureflow.io**.
- Callback now only fires once per call to `Featureflow.init(...)`
## [0.1.0] - 2017-03-20
### Changed
- Initial Build

