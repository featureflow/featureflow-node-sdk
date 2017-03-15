const FeatureflowClient = require('./src/featureflowClient');
const debug = require('./src/debug');
module.exports = {
  init: (apiKey, config, callback) => {
    debug('initializing client');
    const client = new FeatureflowClient(apiKey, config);
    client.on('error', callback);
    client.on('init', ()=>{
      callback(undefined, client);
    })
  }
}