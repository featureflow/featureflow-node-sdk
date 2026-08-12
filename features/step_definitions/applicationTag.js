import { defineSupportCode } from 'cucumber';
import { expect } from 'chai';
import http from 'http';
import Featureflow from '../../src/Client';
import Feature from '../../src/Feature';

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

function startCapturingServer(world, key) {
  world.capturedRequests = [];
  const server = http.createServer((req, res) => {
    world.capturedRequests.push({ method: req.method, url: req.url, headers: req.headers });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end('{}');
    req.resume();
  });
  world[key] = server;
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

defineSupportCode(({ Given, When, Then, After }) => {
  After(function () {
    const servers = [this.captureFeaturesServer, this.captureEventsServer].filter(Boolean);
    return Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  });

  Given('a features endpoint capturing request headers', function () {
    return startCapturingServer(this, 'captureFeaturesServer').then((url) => {
      this.captureFeaturesUrl = url;
    });
  });

  Given('an events endpoint capturing request headers', function () {
    return startCapturingServer(this, 'captureEventsServer').then((url) => {
      this.captureEventsUrl = url;
    });
  });

  When('a client is initialised against it with application {stringInDoubleQuotes}', function (application) {
    this.featureflowClient = new Featureflow({
      apiKey: 'test-api-key-12345',
      baseUrl: this.captureFeaturesUrl,
      eventsUrl: 'http://127.0.0.1:9',
      interval: 0,
      application
    });
  });

  When('a client is initialised against it with no application', function () {
    this.featureflowClient = new Featureflow({
      apiKey: 'test-api-key-12345',
      baseUrl: this.captureFeaturesUrl,
      eventsUrl: 'http://127.0.0.1:9',
      interval: 0
    });
  });

  When(
    'a client with a registered feature is initialised against it with application {stringInDoubleQuotes}',
    function (application) {
      // Registration fires immediately at init; features polling is pointed at a dead
      // port so only the register request reaches the capturing server.
      this.featureflowClient = new Featureflow({
        apiKey: 'test-api-key-12345',
        baseUrl: 'http://127.0.0.1:9',
        eventsUrl: this.captureEventsUrl,
        interval: 0,
        application,
        withFeatures: [new Feature('my-flag').build()]
      });
    }
  );

  Then('the captured features request has X-Featureflow-Application {stringInDoubleQuotes}', function (expected) {
    const world = this;
    return eventually(() => {
      expect(world.capturedRequests.length).to.be.above(0);
      expect(world.capturedRequests[0].headers['x-featureflow-application']).to.equal(expected);
    });
  });

  Then('the captured features request has no X-Featureflow-Application header', function () {
    const world = this;
    return eventually(() => {
      expect(world.capturedRequests.length).to.be.above(0);
      expect(world.capturedRequests[0].headers['x-featureflow-application']).to.equal(undefined);
    });
  });

  Then('the captured register request has X-Featureflow-Application {stringInDoubleQuotes}', function (expected) {
    const world = this;
    return eventually(() => {
      const register = world.capturedRequests.filter((r) => r.url.indexOf('/register') >= 0);
      expect(register.length).to.be.above(0);
      expect(register[0].headers['x-featureflow-application']).to.equal(expected);
    });
  });
});
