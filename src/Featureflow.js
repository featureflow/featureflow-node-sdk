import FeatureflowClient from './FeatureflowClient';
import debug from './debug';


export function init(config, callback) {
  let hasCallback = false;
  if (!callback || typeof callback !== 'function'){
    throw new Error('callback must be a function');
  }

  if (!config.apiKey){
    return callback(new Error('config.apiKey not defined'));
  }
  debug('initializing client');
  const client = new FeatureflowClient(config.apiKey, config);
  client.on('init', ()=>{
    if (!hasCallback){
      hasCallback = true;
      debug('client initialized');
      callback(undefined, client);
    }
  })
}

export const events = {
  UPDATED: 'updated',
  ERROR: 'error'
}

export default {
  init,
  events
}