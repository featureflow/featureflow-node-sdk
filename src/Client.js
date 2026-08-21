import PollingClient from './PollingClient';
import EventsClient from './EventsClient';

const EventEmitter = require('events');
import { InMemoryFeatureStore } from './FeatureStore';
import { UserBuilder } from './User';
import Evaluate from './Evaluate';
import debug from './debug';

import { ruleMatches, getVariantSplitKey, calculateHash, featureEvaluation } from './EvaluateHelpers';
import { sanitiseApplication } from './application';

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

        // Optional workload name sent as X-Featureflow-Application on every request so
        // usage and flag evaluations are attributable per application in the dashboard.
        this.config.application = sanitiseApplication(
            typeof this.config.application !== 'undefined' ? this.config.application : process.env.FEATUREFLOW_APPLICATION
        );

        this.eventsClient = new EventsClient(this.config.apiKey, this.config.eventsUrl, this.config.disableEvents, this.config.application)

        if (this.config.withFeatures) {
            this.config.withFeatures.forEach(feature => {
                debug(`Registering feature with key ${feature.key}`);
                this.failoverVariants[feature.key] = feature.failoverVariant;
            });
            this.eventsClient.registerFeaturesEvent(this.config.withFeatures);
        }

        // Server-driven SDK config arrives on features responses; events responses feed
        // eventsClient.applyServerConfig directly.
        this.config.onSdkConfig = (sdkConfig) => {
            this.eventsClient.applyServerConfig(sdkConfig);
            if (this.pollingClient) {
                this.pollingClient.applyServerConfig(sdkConfig);
            }
        };
        this.config.onUpdate = () => this.emit('updated');

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
            feature ? feature.variants : undefined,
            feature ? feature.trackEvents === true : false,
            () => this._emitEvaluation(key, evaluatedVariant, user, feature)
        );
    }

    /**
     * Fires the 'evaluation' event with { key, variant, value, user } — the hook for
     * forwarding flag exposures to an external analytics or experimentation tool.
     *
     * Fires whenever an evaluation is recorded, i.e. each time a variant is read via
     * value()/is()/isOn()/isOff()/jsonValue() — the same moments an impression is
     * counted, so the hook and Featureflow's own statistics always agree. Listener
     * errors are swallowed: a broken analytics hook must never break flag evaluation.
     */
    _emitEvaluation(key, evaluatedVariant, user, feature) {
        if (this.listenerCount('evaluation') === 0) {
            return;
        }
        try {
            const variants = feature ? feature.variants : undefined;
            const variant = variants ? variants.find(v => v.key === evaluatedVariant) : undefined;
            this.emit('evaluation', {
                key,
                variant: evaluatedVariant,
                value: variant ? variant.value : undefined,
                user
            });
        } catch (e) {
            debug(`An 'evaluation' listener threw: ${e && e.message}`);
        }
    }

    /**
     * Record a goal (track) event for experimentation and metric-gated rollouts.
     * `details` may be a number (the metric value) or an object with an optional numeric
     * `value` plus custom fields — the same shape as the OpenFeature tracking API, so an
     * OpenFeature provider can forward its track() calls here unchanged.
     */
    track(goalKey, user, details) {
        this.eventsClient.trackEvent(goalKey, user, details);
        return this;
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