import request from 'request';
import debug from './debug';

export default class PollingClient {
    DEFAULT_TIMEOUT = 5 * 1000;
    DEFAULT_INTERVAL = 10 * 1000;
    clientVersion = 'NodeJsClient/0.6.6';

    constructor(url, config, callback) {
        this.url = url;
        this.apiKey = config.apiKey;
        this.featureStore = config.featureStore;
        this.pollingInterval = this.DEFAULT_INTERVAL;
        if (config.interval && config.interval > 5 || config.interval == 0) {
            this.pollingInterval = config.interval * 1000
        }
        this.timeout = this.DEFAULT_TIMEOUT;
        this.etag = "";

        this.getFeatures(callback);
        if (this.pollingInterval > 0) {
            this.interval = setInterval(this.getFeatures.bind(this), this.pollingInterval);
        } else {
            debug("Polling interval set to 0. Featureflow will NOT poll for feature changes.");
        }

    }
    getFeatures(callback = () => { }) {
        request({
            method: 'get',
            uri: this.url,
            timeout: this.timeout,
            headers: {
                'Authorization': 'Bearer ' + this.apiKey,
                'If-None-Match': this.etag,
                'X-Featureflow-Client': this.clientVersion
            }
        }, (error, response, body) => {
            if (response) {
                if (response.statusCode === 200) {
                    this.etag = response.headers['etag'];
                    debug("updating features");
                    this.featureStore.setAll(JSON.parse(body));
                }
                else if (response.statusCode >= 400 || error) {
                    debug("request for features failed with response status %d", response.statusCode);
                }
                callback()
            } else {
                if (error.code != null) {
                    debug(error.code);
                }
            }

        })
    }

    close() {
        clearInterval(this.interval);
    }
}