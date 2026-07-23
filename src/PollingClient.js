import request from 'request';
import debug from './debug';
import pkg from '../package.json';

export default class PollingClient {
    DEFAULT_TIMEOUT = 5 * 1000;
    DEFAULT_INTERVAL = 20 * 1000;
    clientVersion = `NodeJsClient/${pkg.version}`;
    lastRefreshTime = 0;
    refreshInProgress = false;

    constructor(url, config, callback) {
        this.url = url;
        this.apiKey = config.apiKey;
        this.featureStore = config.featureStore;
        // Called with the parsed X-Featureflow-Sdk-Config header (server-driven SDK config)
        // whenever a features response carries one — on 304s too, which is what a polling
        // client mostly sees.
        this.onSdkConfig = config.onSdkConfig;
        this.pollingInterval = this.DEFAULT_INTERVAL;
        if (config.interval && config.interval > 5 || config.interval == 0) {
            this.pollingInterval = config.interval * 1000
        }
        this.timeout = this.DEFAULT_TIMEOUT;
        this.etag = "";
        if (this.apiKey && this.apiKey.length > 10) {
            this.getFeatures(callback);
            if (this.pollingInterval > 0) {
                this.interval = setInterval(this.getFeatures.bind(this), this.pollingInterval);
            } else {
                debug("Polling interval set to 0. Featureflow will NOT poll for feature changes.");
            }
        } else {
            debug("API key is missing or too short. Features will not be fetched.");
        }

    }
    getFeatures(callback = () => { }) {
        this.refreshInProgress = true;
        this.lastRefreshTime = Date.now();
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
            this.refreshInProgress = false;
            if (response) {
                this.handleSdkConfigHeader(response.headers);
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
                callback()
            }

        })
    }

    handleSdkConfigHeader(headers) {
        if (!this.onSdkConfig || !headers) {
            return;
        }
        const raw = headers['x-featureflow-sdk-config'];
        if (!raw) {
            return;
        }
        try {
            this.onSdkConfig(JSON.parse(raw));
        } catch (e) {
            debug('ignoring malformed X-Featureflow-Sdk-Config header: %s', raw);
        }
    }

    maybeRefresh() {
        // pollingInterval 0 means polling is disabled entirely — lazy refresh included,
        // otherwise every evaluate() would trigger a features request.
        if (this.pollingInterval <= 0) {
            return;
        }
        const now = Date.now();
        const elapsed = now - this.lastRefreshTime;

        if (elapsed >= this.pollingInterval && !this.refreshInProgress) {
            this.getFeatures();
        }
    }

    close() {
        clearInterval(this.interval);
    }
}