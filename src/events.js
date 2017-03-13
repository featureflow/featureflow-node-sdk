const request = require('request');
const debug = require('./debug');

module.exports = class Events{
  constructor(apiKey, hostname){
    this.apiKey = apiKey;
    this.hostname = hostname;
  }

  _post(path, json){
    debug('post "%s"', this.hostname+path);
    request({
      method: 'POST',
      uri: this.hostname + path,
      json,
      headers: {
        'Authorization': 'Bearer '+this.apiKey,
      }
    }, (errors, response, body)=>{
      if (response.statusCode < 200 || response.statusCode > 299){
        debug('error posting, uri="%s", json=%o, apiKey=%s', this.hostname+path, json, this.apiKey);
      }
    })
  }

  send(featureKey, expectedVariant, evaluatedVariant, context){
    debug('sending evaluate event for feature "%s"', featureKey);
    this._post('/api/sdk/v1/events', {
      featureKey,
      evaluatedVariant,
      expectedVariant,
      context
    });
  }

  register(features){
    debug('sending registration event for features="%o"', features);
    debug('sending registration event not implemented');
    console.log('REGISTER', features);
  }
}