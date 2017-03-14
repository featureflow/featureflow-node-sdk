const FeatureflowClient = require('./src/featureflowClient');
const debug = require('./src/debug');
module.exports = {
  init: (apiKey, config, callback) => {
    debug('initializing client');
    const client = new FeatureflowClient(apiKey, config, (err)=>{
      if (err){
        debug('init error: %O', err);
        callback(err);
      }
      else{
        debug('client initialized');
        callback(undefined, client);
      }
    });
  }
}