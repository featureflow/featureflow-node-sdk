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
    evaluateEvent(featureKey, evaluatedVariant, expectedVariant, user) {
      this.queue.push({ featureKey, evaluatedVariant, expectedVariant, user });
    },
    close() {}
  };
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
      world.receivedRequests.push({ method: req.method, url: req.url });
      res.statusCode = status;
      if (retryAfter) {
        res.setHeader('Retry-After', String(retryAfter));
      }
      res.end();
      req.resume();
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

  Given('an events client with a queue capacity of {int}', function (capacity) {
    this.eventsClient = new EventsClient('test-api-key', 'http://127.0.0.1:9');
    this.eventsClient.QUEUE_SIZE = capacity;
  });

  Given('an events client pointed at the local endpoint', function () {
    this.eventsClient = new EventsClient('test-api-key', this.eventsUrl);
  });

  When('{int} evaluate events are queued', function (count) {
    for (let i = 0; i < count; i++) {
      this.eventsClient.evaluateEvent('feature-' + i, 'on', null, { id: 'user-' + i });
    }
  });

  When('the event queue is flushed', function () {
    this.eventsClient.sendQueue();
  });

  Then('the event queue should contain {int} events', function (count) {
    const client = this.eventsClient;
    return eventually(() => expect(client.queue).to.have.lengthOf(count));
  });

  Then('the events client should become disabled', function () {
    const client = this.eventsClient;
    return eventually(() => expect(client.disabled).to.equal(true));
  });

  Then('queueing another evaluate event should leave the queue empty', function () {
    this.eventsClient.evaluateEvent('another-feature', 'on', null, { id: 'user-x' });
    expect(this.eventsClient.queue).to.have.lengthOf(0);
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
