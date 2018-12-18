import request from 'request';
import debug from './debug';

export default class EventsClient{
  DEFAULT_TIMEOUT = 5 * 1000;
  clientVersion = 'NodeJsClient/0.6.4';

  constructor(apiKey, eventsUrl="https://events.featureflow.io", disabled = false){
    this.apiKey = apiKey;
    this.eventsUrl = eventsUrl;
    this.disabled = disabled;
    this.timeout = this.DEFAULT_TIMEOUT;
  }
  registerFeaturesEvent(features){
    this.sendEvent(
      'Register Features',
      'PUT',
      this.eventsUrl+'/api/sdk/v1/register',
      features
    )
  }
  evaluateEvent(featureKey, evaluatedVariant, expectedVariant, user){
    this.sendEvent(
      'evaluate',
      'POST',
      this.eventsUrl+'/api/sdk/v1/events',
      [{
        featureKey,
        evaluatedVariant,
        expectedVariant,
        user
      }]);
  }

  sendEvent(eventType, method, url, json){

    if (this.disabled){
      return;
    }
    request({
      method,
      uri: url,
      json,
      headers: {
        'Authorization': 'Bearer '+this.apiKey,
        'X-Featureflow-Client': this.clientVersion
      }
    }, (error, response, body)=>{
      if (error){
        debug('error %s to "%s". message:', method, url, error.message);
        return;
      }
      if (response.statusCode >= 400){
        debug("unable to send event %s to %s. Failed with response status %d", eventType, url, response.statusCode);
      }
    })
  }

}