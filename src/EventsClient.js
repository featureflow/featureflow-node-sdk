import request from 'request';
import debug from './debug';
import pkg from '../package.json';

export default class EventsClient {
    SEND_INTERVAL = 60;
    QUEUE_SIZE = 10000;
    DEFAULT_RETRY_AFTER = 60;
    clientVersion = `NodeJsClient/${pkg.version}`;
    queue = [];
    overLimit = false;
    backoffUntil = 0;

    constructor(apiKey, eventsUrl = "https://events.featureflow.io", disabled = false) {
        this.apiKey = apiKey;
        this.eventsUrl = eventsUrl;
        this.disabled = disabled;
        this.sendInterval = this.SEND_INTERVAL;
        this.interval = setInterval(() => {
            this.sendQueue();

        }, this.sendInterval * 1000);
    }

    registerFeaturesEvent(features) {
        this.sendEvent(
            'Register Features',
            'PUT',
            this.eventsUrl + '/api/sdk/v1/register',
            features
        )
    }

    evaluateEvent(featureKey, evaluatedVariant, expectedVariant, user) {
        this.queueEvaluateEvent(
            {
                featureKey,
                evaluatedVariant,
                expectedVariant,
                user
            }
        );
    }

    queueEvaluateEvent(event) {
        if (this.disabled) {
            return;
        }
        if (this.queue.length < this.QUEUE_SIZE) {
            this.queue.push(event);
            this.overLimit = false;
        } else {
            this.overLimit = true;
            debug('Event queue limit of %d exceeded. Events will be dropped until the queue is flushed.', this.QUEUE_SIZE);
        }
    }

    sendQueue() {
        if (this.disabled || this.queue.length === 0) return;
        if (Date.now() < this.backoffUntil) {
            debug('Event sending is backing off after a 429 response. Retaining %d queued events.', this.queue.length);
            return;
        }
        let sendQueue = this.queue;
        this.queue = [];

        this.sendEvent(
            'evaluate',
            'POST',
            this.eventsUrl + '/api/sdk/v1/events',
            sendQueue,
            (statusCode, headers) => {
                if (statusCode === 429) {
                    this.backoffUntil = Date.now() + this.parseRetryAfter(headers) * 1000;
                    // Requeue the rejected batch ahead of anything queued since, dropping the
                    // newest events if the combined queue exceeds capacity.
                    this.queue = sendQueue.concat(this.queue).slice(0, this.QUEUE_SIZE);
                }
            });
    }

    parseRetryAfter(headers) {
        const retryAfter = parseInt(headers && headers['retry-after'], 10);
        return retryAfter > 0 ? retryAfter : this.DEFAULT_RETRY_AFTER;
    }

    sendEvent(eventType, method, url, json, onResponse) {
        if (this.disabled) {
            return;
        }
        request({
            method,
            uri: url,
            json,
            headers: {
                'Authorization': 'Bearer ' + this.apiKey,
                'X-Featureflow-Client': this.clientVersion
            }
        }, (error, response, body) => {
            if (error) {
                debug('error %s to "%s". message:', method, url, error.message);
                return;
            }
            if (response.statusCode === 401 || response.statusCode === 403) {
                debug("received %d sending event %s to %s. The API key is not authorized — disabling event sending for the lifetime of this client.", response.statusCode, eventType, url);
                this.disable();
                return;
            }
            if (response.statusCode >= 400) {
                debug("unable to send event %s to %s. Failed with response status %d", eventType, url, response.statusCode);
            }
            if (onResponse) {
                onResponse(response.statusCode, response.headers);
            }
        })
    }

    disable() {
        this.disabled = true;
        this.queue = [];
        clearInterval(this.interval);
    }

    close() {
        clearInterval(this.interval);
    }


}
