import FeatureflowClient from './FeatureflowClient';
import debug from './debug';


export function init(config, callback) {
  if (!config.apiKey){
    throw new Error('config.apiKey not defined');
  }
  if (!callback || typeof callback !== 'function'){
    throw new Error('callback must be a function');
  }
  debug('initializing client');
  const client = new FeatureflowClient(config.apiKey, config);
  client.on('error', callback);
  client.on('init', ()=>{
    debug('client initialized');
    callback(undefined, client);
  })
}

export default {
  init
}