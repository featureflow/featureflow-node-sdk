import { defineSupportCode } from 'cucumber';
import { expect } from 'chai';
import http from 'http';
import EventsClient from '../../src/EventsClient';
import Featureflow from '../../src/Client';

// Polls until check() stops throwing, so steps can wait on the async request callback
// inside EventsClient without racing it.
function eventually(check, timeoutMs = 2000, intervalMs = 20) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      try {
        check();
        resolve();
      } catch (err) {
        if (Date.now() - started > timeoutMs) {
          reject(err);
        } else {
          setTimeout(attempt, intervalMs);
        }
      }
    };
    attempt();
  });
}

function fakeEventsClient() {
  return {
    queue: [],
    evaluateEvent(featureKey, evaluatedVariant, user) {
      this.queue.push({ featureKey, evaluatedVariant, user });
    },
    close() {}
  };
}

function summaryEntry(client, featureKey, variant) {
  let found = null;
  client.summaries.forEach((entry) => {
    if (entry.featureKey === featureKey && entry.evaluatedVariant === variant) {
      found = entry;
    }
  });
  return found;
}

defineSupportCode(({ Given, When, Then, After }) => {
  After(function () {
    if (this.eventsClient && this.eventsClient.close) {
      this.eventsClient.close();
    }
    if (this.featureflowClient) {
      this.featureflowClient.close();
    }
    if (this.eventsServer) {
      return new Promise((resolve) => this.eventsServer.close(resolve));
    }
  });

  function startEventsEndpoint(world, status, retryAfter) {
    world.receivedRequests = [];
    world.eventsServer = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        let body;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) {
          body = undefined;
        }
        world.receivedRequests.push({ method: req.method, url: req.url, body });
        res.statusCode = status;
        if (retryAfter) {
          res.setHeader('Retry-After', String(retryAfter));
        }
        res.end();
      });
    });
    return new Promise((resolve) => {
      world.eventsServer.listen(0, '127.0.0.1', () => {
        world.eventsUrl = `http://127.0.0.1:${world.eventsServer.address().port}`;
        resolve();
      });
    });
  }

  Given('a local events endpoint that responds with status {int}', function (status) {
    return startEventsEndpoint(this, status);
  });

  Given('a local events endpoint that responds with status {int} and Retry-After {int}', function (status, retryAfter) {
    return startEventsEndpoint(this, status, retryAfter);
  });

  // Port 9 (discard) never answers, so nothing is ever actually sent.
  Given('an events client', function () {
    this.eventsClient = new EventsClient('test-api-key', 'http://127.0.0.1:9');
  });

  Given('an events client with a summary capacity of {int}', function (capacity) {
    this.eventsClient = new EventsClient('test-api-key', 'http://127.0.0.1:9');
    this.eventsClient.SUMMARY_CAPACITY = capacity;
  });

  Given('an events client pointed at the local endpoint', function () {
    this.eventsClient = new EventsClient('test-api-key', this.eventsUrl);
  });

  When('{int} evaluate events are queued', function (count) {
    for (let i = 0; i < count; i++) {
      this.eventsClient.evaluateEvent('feature-' + i, 'on', { id: 'user-' + i });
    }
  });

  When('{int} evaluate events are queued for feature {stringInDoubleQuotes} variant {stringInDoubleQuotes} user {stringInDoubleQuotes}', function (count, featureKey, variant, userId) {
    for (let i = 0; i < count; i++) {
      this.eventsClient.evaluateEvent(featureKey, variant, { id: userId });
    }
  });

  When('the event queue is flushed', function () {
    this.eventsClient.sendQueue();
  });

  Then('the pending summary should contain {int} entries', function (count) {
    const client = this.eventsClient;
    return eventually(() => expect(client.summaries.size).to.equal(count));
  });

  Then('the pending summary for feature {stringInDoubleQuotes} variant {stringInDoubleQuotes} should have {int} impressions', function (featureKey, variant, impressions) {
    const client = this.eventsClient;
    return eventually(() => {
      const entry = summaryEntry(client, featureKey, variant);
      expect(entry, `summary entry for ${featureKey}/${variant}`).to.not.equal(null);
      expect(entry.impressions).to.equal(impressions);
    });
  });

  Then('the pending summary entry for feature {stringInDoubleQuotes} variant {stringInDoubleQuotes} should include user {stringInDoubleQuotes}', function (featureKey, variant, userId) {
    const client = this.eventsClient;
    return eventually(() => {
      const entry = summaryEntry(client, featureKey, variant);
      expect(entry, `summary entry for ${featureKey}/${variant}`).to.not.equal(null);
      expect(entry.users.map((u) => u.id)).to.include(userId);
    });
  });

  Then('the pending summary entry for feature {stringInDoubleQuotes} variant {stringInDoubleQuotes} should include no users', function (featureKey, variant) {
    const entry = summaryEntry(this.eventsClient, featureKey, variant);
    expect(entry, `summary entry for ${featureKey}/${variant}`).to.not.equal(null);
    expect(entry.users).to.have.lengthOf(0);
  });

  Then('the events client should become disabled', function () {
    const client = this.eventsClient;
    return eventually(() => expect(client.disabled).to.equal(true));
  });

  Then('queueing another evaluate event should leave the summary empty', function () {
    this.eventsClient.evaluateEvent('another-feature', 'on', { id: 'user-x' });
    expect(this.eventsClient.summaries.size).to.equal(0);
  });

  Then('the events client should be backing off', function () {
    const client = this.eventsClient;
    return eventually(() => expect(client.backoffUntil).to.be.above(Date.now()));
  });

  Then('the local endpoint should have received {int} request', function (count) {
    const world = this;
    // Give a would-be second request time to arrive before asserting it did not.
    return new Promise((resolve) => setTimeout(resolve, 150))
      .then(() => expect(world.receivedRequests).to.have.lengthOf(count));
  });

  Then('the local endpoint should have received a batch of {int} events', function (count) {
    const world = this;
    return eventually(() => {
      expect(world.receivedRequests).to.have.lengthOf(1);
      expect(world.receivedRequests[0].body).to.have.lengthOf(count);
    });
  });

  Then('the batch should total {int} impressions for feature {stringInDoubleQuotes} variant {stringInDoubleQuotes}', function (impressions, featureKey, variant) {
    const total = this.receivedRequests[0].body
      .filter((e) => e.featureKey === featureKey && e.evaluatedVariant === variant)
      .reduce((sum, e) => sum + e.impressions, 0);
    expect(total).to.equal(impressions);
  });

  Then('the batch should include users {stringInDoubleQuotes} and {stringInDoubleQuotes}', function (userA, userB) {
    const userIds = this.receivedRequests[0].body
      .filter((e) => e.user)
      .map((e) => e.user.id);
    expect(userIds).to.include(userA);
    expect(userIds).to.include(userB);
    expect(userIds).to.have.lengthOf(new Set(userIds).size);
  });

  Then('the batch events should not include an expectedVariant', function () {
    this.receivedRequests[0].body.forEach((e) => {
      expect(e).to.not.have.property('expectedVariant');
    });
  });

  Given('a Featureflow client with the stored features', function (table) {
    // A short (<=10 char) apiKey stops PollingClient fetching, and interval 0 disables
    // polling and lazy refresh, so the client runs entirely offline.
    this.featureflowClient = new Featureflow({ apiKey: 'test-key', interval: 0 });
    this.featureflowClient.eventsClient.close();
    this.featureflowClient.eventsClient = fakeEventsClient();
    this.eventsClient = this.featureflowClient.eventsClient;

    const features = {};
    table.hashes().forEach((row) => {
      features[row.key] = {
        key: row.key,
        enabled: row.enabled === 'true',
        offVariantKey: row.offVariantKey,
        rules: [{
          audience: null,
          variantSplits: [{ variantKey: row.defaultVariant, split: 100 }]
        }]
      };
    });
    this.featureflowClient.config.featureStore.setAll(features);
  });

  When('evaluateAll is called for user {stringInDoubleQuotes}', function (user) {
    this.evaluatedFeatures = this.featureflowClient.evaluateAll(user);
  });

  When('evaluate {stringInDoubleQuotes} is called for user {stringInDoubleQuotes} and isOn is checked', function (key, user) {
    this.featureflowClient.evaluate(key, user).isOn();
  });

  Then('the evaluated features should be', function (table) {
    const expected = {};
    table.hashes().forEach((row) => {
      expected[row.key] = row.variant;
    });
    expect(this.evaluatedFeatures).to.deep.equal(expected);
  });

  Then('no evaluate events should have been recorded', function () {
    expect(this.eventsClient.queue).to.have.lengthOf(0);
  });

  Then('{int} evaluate event should have been recorded', function (count) {
    expect(this.eventsClient.queue).to.have.lengthOf(count);
  });
});
