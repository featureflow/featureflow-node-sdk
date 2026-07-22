import PollingClient from './PollingClient';
import EventsClient from './EventsClient';

const EventEmitter = require('events');
import { InMemoryFeatureStore } from './FeatureStore';
import { UserBuilder } from './User';
import Evaluate from './Evaluate';
import debug from './debug';

import { ruleMatches, getVariantSplitKey, calculateHash, featureEvaluation } from './EvaluateHelpers';

function trimTrailingSlashes(url) {
    if (typeof url !== 'string' || !url.length) {
        return url;
    }
    return url.replace(/\/+$/, '');
}

export default class Featureflow extends EventEmitter {
    failoverVariants = {};
    isReady = false;

    constructor(config, callback = (_err, self) => {
    }) {
        super();
        debug("initializing client");
        if (!callback && typeof config === "function") {
            callback = config;
            config = undefined;
        }
        this.config = {
            baseUrl: 'https://app.featureflow.io',
            eventsUrl: 'https://events.featureflow.io',
            ...config
        };

        if (config == null || typeof config.baseUrl === 'undefined') {
            if (process.env.FEATUREFLOW_BASE_URL) {
                this.config.baseUrl = process.env.FEATUREFLOW_BASE_URL;
            }
        }
        if (config == null || typeof config.eventsUrl === 'undefined') {
            if (process.env.FEATUREFLOW_EVENTS_URL) {
                this.config.eventsUrl = process.env.FEATUREFLOW_EVENTS_URL;
            }
        }

        this.config.baseUrl = trimTrailingSlashes(this.config.baseUrl);
        this.config.eventsUrl = trimTrailingSlashes(this.config.eventsUrl);

        this.config.apiKey = this.config.apiKey || process.env.FEATUREFLOW_SERVER_KEY || "";
        if (!this.config.apiKey.length) {
            callback(new Error("Api Key must be provided"));
        }

        this.config.featureStore = new InMemoryFeatureStore();
        this.config.disableEvents = this.config.disableEvents || false;

        this.eventsClient = new EventsClient(this.config.apiKey, this.config.eventsUrl, this.config.disableEvents)

        if (this.config.withFeatures) {
            this.config.withFeatures.forEach(feature => {
                debug(`Registering feature with key ${feature.key}`);
                this.failoverVariants[feature.key] = feature.failoverVariant;
            });
            this.eventsClient.registerFeaturesEvent(this.config.withFeatures);
        }

        this.pollingClient = new PollingClient(this.config.baseUrl + '/api/sdk/v1/features', this.config, () => {
            debug("client initialized");
            this.isReady = true;
            this.emit('ready');
            callback(null, this);
        });
    }

    ready(callback = () => {
    }) {
        if (this.isReady) {
            callback(null, this);
        }
        else {
            return this.once('ready', () => {
                callback(null, this);
            })
        }
    }

    /**
     * Evaluates every feature without recording evaluation events — bulk snapshots
     * (e.g. bootstrapping a client-side SDK) would otherwise emit one event per
     * feature per call. Impression tracking only happens through evaluate().
     */
    evaluateAll(user) {
        this.pollingClient.maybeRefresh();
        let evaluatedFeatures = {};
        let features = this.config.featureStore.getAll();
        for (let p in features) {
            if (features.hasOwnProperty(p)) {
                evaluatedFeatures[p] = this._evaluateVariant(p, user).evaluatedVariant;
            }
        }
        return evaluatedFeatures;
    }

    evaluate(key, user) {
        this.pollingClient.maybeRefresh();
        const { evaluatedVariant, feature } = this._evaluateVariant(key, user);

        return new Evaluate(
            key,
            evaluatedVariant,
            user,
            this.eventsClient,
            feature ? feature.variants : undefined
        );
    }

    _evaluateVariant(key, user) {
        let evaluatedVariant;
        let feature = this.config.featureStore.get(key);

        if (!feature) {
            let failover = this.failoverVariants[key];
            if (!failover) {
                evaluatedVariant = "off";
            }
            else {
                evaluatedVariant = failover
            }
            debug(`Evaluating undefined feature '${key}' using the ${failover ? 'provided' : 'default'} failover '${evaluatedVariant}'`);
        }
        else {
            evaluatedVariant = featureEvaluation(feature, user);
        }

        return { evaluatedVariant, feature };
    }

    close() {
        this.pollingClient.close();
        this.eventsClient.close();
    }
}