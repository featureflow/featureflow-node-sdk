import request from 'request';
import debug from './debug';

export default class PollingClient{
  DEFAULT_TIMEOUT = 5 * 1000;
  DEFAULT_INTERVAL = 30 * 1000;

  constructor(url, config, callback){
    this.url = url;
    this.apiKey = config.apiKey;
    this.featureStore = config.featureStore;

    this.etag = "";

    this.timeout = this.DEFAULT_TIMEOUT;
    this.interval = this.DEFAULT_INTERVAL;

    this.getFeatures(callback);

    const interval = setInterval(this.getFeatures.bind(this), this.interval);

    return clearInterval.bind(this, interval);
  }
  getFeatures(callback = ()=>{}){
    request({
      method: 'get',
      uri: this.url,
      timeout: this.timeout,
      headers: {
        'Authorization': 'Bearer '+this.apiKey,
        'If-None-Match': this.etag,
        'X-Featureflow-Client': 'NodeJsClient/0.6.4'
      }
    }, (error, response, body)=>{
      if (response){
          if (response.statusCode === 200){
              this.etag = response.headers['etag'];
              debug("updating features");
              this.featureStore.setAll(JSON.parse(body));
          }
          else if (response.statusCode >= 400 || error){
              debug("request for features failed with response status %d", response.statusCode);
          }
          callback()
      }else{
        if(error.code != null){
          debug(error.code);
        }
      }

    })
  }
}