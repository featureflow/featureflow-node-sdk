import FeatureflowClient from './FeatureflowClient';
import debug from './debug';


export function init(config, callback) {
  let hasCallback = false;

  if (!config.apiKey){
    return callback(new Error('config.apiKey not defined'));
  }
  debug('initializing client');
  const client = new FeatureflowClient(config.apiKey, config);
  client.on('init', ()=>{
    if (!hasCallback){
      hasCallback = true;
      debug('client initialized');
      if (callback){
        callback(undefined, client);
      }
    }
  });

  return client;
}

export const events = {
  INIT: 'init',
  INIT_VERBOSE: 'init_verbose',
  UPDATED: 'updated',
  UPDATED_VERBOSE: 'updated_verbose',
  ERROR: 'error'
};

export default {
  init,
  events
}