const FeatureflowClient = require('./src/featureflowClient');
module.exports = {
  init: (apiKey, config) => {
    return new FeatureflowClient(apiKey, config);
  }
}