import request from 'request';
import debug from './debug';
import pkg from '../package.json';

// Separator for the (featureKey, evaluatedVariant) summary key; matches the grouping key
// used by sdk-server's eventSummariser.
const KEY_SEPARATOR = '\x1f';

export default class EventsClient {
    SEND_INTERVAL = 60;
    MIN_SEND_INTERVAL = 1;
    MAX_SEND_INTERVAL = 3600;
    SUMMARY_CAPACITY = 10000;
    GOALS_CAPACITY = 10000;
    USER_CACHE_CAPACITY = 1000;
    TRACKED_USER_CACHE_CAPACITY = 10000;
    DEFAULT_RETRY_AFTER = 60;
    clientVersion = `NodeJsClient/${pkg.version}`;
    // (featureKey, variant) -> { featureKey, evaluatedVariant, impressions, users }
    summaries = new Map();
    // Pending goal (track) events, sent raw — experiment analysis joins them on user id.
    goals = [];
    // User ids already attached to an entry this flush interval; insertion-ordered so the
    // oldest id can be evicted when the cache is full.
    seenUserIds = new Map();
    // (featureKey, userId) pairs already attached this interval for trackEvents flags,
    // which need per-flag exposure fidelity rather than the global one-per-user dedupe.
    seenTrackedUserFlags = new Map();
    overLimit = false;
    backoffUntil = 0;
    // Server-driven state (X-Featureflow-Sdk-Config header / events response body).
    // `suspended` is reversible, unlike `disabled` which is permanent for the client's life.
    mode = 'summary';
    suspended = false;
    // Unique map keys for full-mode entries, where events must not merge.
    fullModeCounter = 0;

    constructor(apiKey, eventsUrl = "https://events.featureflow.io", disabled = false) {
        this.apiKey = apiKey;
        this.eventsUrl = eventsUrl;
        this.disabled = disabled;
        this.sendInterval = this.SEND_INTERVAL;
        this.interval = setInterval(() => {
            this.sendQueue();

        }, this.sendInterval * 1000);
    }

    /**
     * Apply server-driven config: `{ eventsEnabled, mode, flushIntervalSeconds }`, delivered
     * via the X-Featureflow-Sdk-Config response header on /features and as the /events
     * response body. Absent fields keep their current value; invalid values are ignored, so
     * a malformed response can never turn events on where they were locally disabled or
     * break the flush timer.
     */
    applyServerConfig(config) {
        if (this.disabled || config == null || typeof config !== 'object') {
            return;
        }
        if (typeof config.eventsEnabled === 'boolean') {
            this.setSuspended(!config.eventsEnabled);
        }
        if (config.mode === 'summary' || config.mode === 'full' || config.mode === 'off') {
            this.mode = config.mode;
        }
        const seconds = config.flushIntervalSeconds;
        if (typeof seconds === 'number' && seconds >= this.MIN_SEND_INTERVAL && seconds <= this.MAX_SEND_INTERVAL) {
            this.setSendInterval(seconds);
        }
    }

    setSuspended(suspended) {
        if (suspended && !this.suspended) {
            debug('Event sending suspended by server config.');
            this.summaries = new Map();
            this.goals = [];
            this.seenUserIds.clear();
            this.seenTrackedUserFlags.clear();
        }
        if (!suspended && this.suspended) {
            debug('Event sending re-enabled by server config.');
        }
        this.suspended = suspended;
    }

    setSendInterval(seconds) {
        if (seconds === this.sendInterval) {
            return;
        }
        debug('Event flush interval changed by server config: %ds -> %ds', this.sendInterval, seconds);
        this.sendInterval = seconds;
        clearInterval(this.interval);
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

    /**
     * Record a goal (track) event: `{ type: 'goal', goalKey, user, value?, data?, timestamp }`.
     * `details` may be a number (the metric value) or an object whose optional `value` is the
     * metric value and whose remaining fields are sent as `data` — mirroring the OpenFeature
     * tracking API so a provider can forward `track()` calls 1:1. Goals are sent raw (no
     * summarisation): analysis joins them against exposures on the user id.
     */
    trackEvent(goalKey, user, details) {
        if (this.disabled || this.suspended || this.mode === 'off' || !goalKey) {
            return;
        }
        if (this.goals.length >= this.GOALS_CAPACITY) {
            debug('Goal event capacity of %d exceeded. Goals will be dropped until the queue is flushed.', this.GOALS_CAPACITY);
            return;
        }
        const event = {
            type: 'goal',
            goalKey,
            timestamp: new Date().toISOString(),
            user
        };
        if (typeof details === 'number') {
            event.value = details;
        } else if (details != null && typeof details === 'object') {
            if (typeof details.value === 'number') {
                event.value = details.value;
            }
            const data = {};
            let hasData = false;
            for (const key in details) {
                if (key !== 'value' && Object.prototype.hasOwnProperty.call(details, key)) {
                    data[key] = details[key];
                    hasData = true;
                }
            }
            if (hasData) {
                event.data = data;
            }
        }
        this.goals.push(event);
    }

    evaluateEvent(featureKey, evaluatedVariant, user, trackEvents) {
        if (this.disabled || this.suspended || this.mode === 'off') {
            return;
        }
        // In full mode every evaluation is its own entry (unique key, one impression, its
        // own user) — the raw pre-summarisation wire shape, selectable by server config.
        const key = this.mode === 'full'
            ? String(this.fullModeCounter++)
            : featureKey + KEY_SEPARATOR + evaluatedVariant;
        let entry = this.summaries.get(key);
        if (!entry) {
            if (this.summaries.size >= this.SUMMARY_CAPACITY) {
                this.overLimit = true;
                debug('Summary capacity of %d feature/variant entries exceeded. New entries will be dropped until the summary is flushed.', this.SUMMARY_CAPACITY);
                return;
            }
            this.overLimit = false;
            entry = { featureKey, evaluatedVariant, impressions: 0, users: [] };
            this.summaries.set(key, entry);
        }
        entry.impressions++;
        this.attachUser(entry, user, trackEvents);
    }

    // Attach each distinct user to at most one summary entry per flush interval, so the
    // server still sees every user's attributes without the payload repeating the user on
    // every evaluation. Flags with `trackEvents` (experiment exposure fidelity) instead
    // attach each distinct user once per flag per interval, so every (user, flag, variant)
    // assignment reaches the server.
    attachUser(entry, user, trackEvents) {
        if (!user || !user.id) {
            return;
        }
        if (this.mode === 'full') {
            entry.users.push(user);
            return;
        }
        if (trackEvents) {
            const trackedKey = entry.featureKey + KEY_SEPARATOR + user.id;
            if (this.seenTrackedUserFlags.has(trackedKey)) {
                return;
            }
            if (this.seenTrackedUserFlags.size >= this.TRACKED_USER_CACHE_CAPACITY) {
                this.seenTrackedUserFlags.delete(this.seenTrackedUserFlags.keys().next().value);
            }
            this.seenTrackedUserFlags.set(trackedKey, true);
            entry.users.push(user);
            return;
        }
        if (this.seenUserIds.has(user.id)) {
            return;
        }
        if (this.seenUserIds.size >= this.USER_CACHE_CAPACITY) {
            this.seenUserIds.delete(this.seenUserIds.keys().next().value);
        }
        this.seenUserIds.set(user.id, true);
        entry.users.push(user);
    }

    sendQueue() {
        if (this.disabled || this.suspended || this.mode === 'off') return;
        if (this.summaries.size === 0 && this.goals.length === 0) return;
        if (Date.now() < this.backoffUntil) {
            debug('Event sending is backing off after a 429 response. Retaining %d summarised events and %d goals.', this.summaries.size, this.goals.length);
            return;
        }
        let sendSummaries = this.summaries;
        let sendGoals = this.goals;
        this.summaries = new Map();
        this.goals = [];
        this.seenUserIds.clear();
        this.seenTrackedUserFlags.clear();

        this.sendEvent(
            'evaluate',
            'POST',
            this.eventsUrl + '/api/sdk/v1/events',
            this.buildBatch(sendSummaries).concat(sendGoals),
            (statusCode, headers, body) => {
                if (statusCode === 429) {
                    this.backoffUntil = Date.now() + this.parseRetryAfter(headers) * 1000;
                    this.requeue(sendSummaries);
                    this.goals = sendGoals.concat(this.goals).slice(0, this.GOALS_CAPACITY);
                }
                if (statusCode === 200) {
                    // The events response body carries the server-driven SDK config.
                    this.applyServerConfig(body);
                }
            });
    }

    // One event per (featureKey, variant) with summed impressions. A wire event carries at
    // most one user and the server collects distinct users per event, so entries with more
    // than one new user emit one extra single-impression event per additional user, keeping
    // the impression total exact.
    buildBatch(summaries) {
        const events = [];
        summaries.forEach((entry) => {
            const extraUsers = Math.max(entry.users.length - 1, 0);
            events.push({
                featureKey: entry.featureKey,
                evaluatedVariant: entry.evaluatedVariant,
                type: 'evaluate',
                impressions: entry.impressions - extraUsers,
                user: entry.users[0]
            });
            for (let i = 1; i < entry.users.length; i++) {
                events.push({
                    featureKey: entry.featureKey,
                    evaluatedVariant: entry.evaluatedVariant,
                    type: 'evaluate',
                    impressions: 1,
                    user: entry.users[i]
                });
            }
        });
        return events;
    }

    // Merge a 429-rejected batch back over anything summarised since, dropping the newest
    // entries if the combined summary exceeds capacity.
    requeue(sendSummaries) {
        this.summaries.forEach((entry, key) => {
            const rejected = sendSummaries.get(key);
            if (rejected) {
                rejected.impressions += entry.impressions;
                entry.users.forEach((user) => {
                    if (!rejected.users.some((u) => u.id === user.id)) {
                        rejected.users.push(user);
                    }
                });
            } else if (sendSummaries.size < this.SUMMARY_CAPACITY) {
                sendSummaries.set(key, entry);
            }
        });
        this.summaries = sendSummaries;
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
                onResponse(response.statusCode, response.headers, body);
            }
        })
    }

    disable() {
        this.disabled = true;
        this.summaries = new Map();
        this.goals = [];
        this.seenUserIds.clear();
        this.seenTrackedUserFlags.clear();
        clearInterval(this.interval);
    }

    close() {
        clearInterval(this.interval);
    }


}
