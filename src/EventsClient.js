import request from 'request';
import debug from './debug';

export default class EventsClient{
  DEFAULT_TIMEOUT = 5 * 1000;

  constructor(apiKey, baseURL="https://app.featureflow.io", disabled = false){
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.disabled = disabled;
    this.timeout = this.DEFAULT_TIMEOUT;
  }
  registerFeaturesEvent(features){
    this.sendEvent(
      'Register Features',
      'PUT',
      this.baseURL+'/api/sdk/v1/register',
      features
    )
  }
  evaluateEvent(featureKey, evaluatedVariant, expectedVariant, context){
    this.sendEvent(
      'Evaluate',
      'POST',
      this.baseURL+'/api/sdk/v1/events',
      [{
        featureKey,
        evaluatedVariant,
        expectedVariant,
        context
      }]);
  }

  sendEvent(eventName, method, url, json){
    if (this.disabled){
      return;
    }
    request({
      method,
      uri: url,
      json,
      headers: {
        'Authorization': 'Bearer '+this.apiKey,
      }
    }, (error, response, body)=>{
      if (error){
        debug('error %s to "%s". message:', method, url, error.message);
        return;
      }
      if (response.statusCode >= 400){
        debug("unable to send event %s to %s. Failed with response status %d", eventName, url, response.statusCode);
      }
    })
  }

}