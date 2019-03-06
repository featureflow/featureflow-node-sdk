import request from 'request';
import debug from './debug';

export default class EventsClient {
    SEND_INTERVAL = 5;
    QUEUE_SIZE = 10000;
    clientVersion = 'NodeJsClient/0.6.6';
    queue = [];
    overLimit = false;

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
        if (this.queue.length < this.QUEUE_SIZE) {
            this.queue.push(event);
            this.overLimit = false;
        } else {
            this.overLimit = true;
            debug('Event queue limit exceeded. Increase queue size to prevent dropping events.', method, url, "Event Queue Exceeded");
        }
    }

    sendQueue() {
        if(this.queue.length === 0) return;
        let sendQueue = this.queue;
        this.queue = [];

        this.sendEvent(
            'evaluate',
            'POST',
            this.eventsUrl + '/api/sdk/v1/events',
            sendQueue);
    }

    sendEvent(eventType, method, url, json) {

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
            if (response.statusCode >= 400) {
                debug("unable to send event %s to %s. Failed with response status %d", eventType, url, response.statusCode);
            }
        })
    }




    close() {
        clearInterval(this.interval);
    }


}