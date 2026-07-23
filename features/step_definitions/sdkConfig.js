import { defineSupportCode } from 'cucumber';
import { expect } from 'chai';
import http from 'http';
import EventsClient from '../../src/EventsClient';
import Featureflow from '../../src/Client';

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

defineSupportCode(({ Given, When, Then, After }) => {
  After(function () {
    if (this.featuresServer) {
      return new Promise((resolve) => this.featuresServer.close(resolve));
    }
  });

  Given('a disabled events client', function () {
    this.eventsClient = new EventsClient('test-api-key', 'http://127.0.0.1:9', true);
  });

  When('the server config is applied', function (docString) {
    this.eventsClient.applyServerConfig(JSON.parse(docString));
  });

  Then('the events client send interval should be {int} seconds', function (seconds) {
    const client = this.eventsClient;
    return eventually(() => expect(client.sendInterval).to.equal(seconds));
  });

  Then('the events client should become suspended', function () {
    const client = this.eventsClient;
    return eventually(() => expect(client.suspended).to.equal(true));
  });

  Then('the events client should not be suspended', function () {
    expect(this.eventsClient.suspended).to.equal(false);
  });

  Then('every pending entry should have {int} impression and user {stringInDoubleQuotes}', function (impressions, userId) {
    expect(this.eventsClient.summaries.size).to.be.above(0);
    this.eventsClient.summaries.forEach((entry) => {
      expect(entry.impressions).to.equal(impressions);
      expect(entry.users.map((u) => u.id)).to.deep.equal([userId]);
    });
  });

  Given('a local events endpoint that responds with status {int} and config body', function (status, docString) {
    const world = this;
    world.receivedRequests = [];
    world.eventsServer = http.createServer((req, res) => {
      world.receivedRequests.push({ method: req.method, url: req.url });
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(docString);
      req.resume();
    });
    return new Promise((resolve) => {
      world.eventsServer.listen(0, '127.0.0.1', () => {
        world.eventsUrl = `http://127.0.0.1:${world.eventsServer.address().port}`;
        resolve();
      });
    });
  });

  Given('a local features endpoint with config header', function (docString) {
    const world = this;
    world.featuresServer = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('ETag', '"features-etag"');
      res.setHeader('X-Featureflow-Sdk-Config', docString.replace(/\n/g, ' '));
      res.end('{}');
      req.resume();
    });
    return new Promise((resolve) => {
      world.featuresServer.listen(0, '127.0.0.1', () => {
        world.featuresUrl = `http://127.0.0.1:${world.featuresServer.address().port}`;
        resolve();
      });
    });
  });

  Given('a Featureflow client pointed at the local features endpoint', function () {
    // apiKey longer than 10 chars so the PollingClient performs its initial fetch;
    // interval 0 so no polling timer is left running.
    this.featureflowClient = new Featureflow({
      apiKey: 'test-api-key-12345',
      baseUrl: this.featuresUrl,
      eventsUrl: 'http://127.0.0.1:9',
      interval: 0
    });
    this.eventsClient = this.featureflowClient.eventsClient;
  });
});
