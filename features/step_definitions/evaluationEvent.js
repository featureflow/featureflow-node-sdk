import { defineSupportCode } from 'cucumber';
import { expect } from 'chai';
import Evaluate from '../../src/Evaluate';
import Featureflow from '../../src/Client';

// Same rationale as jsonValue.js: the real EventsClient starts a timer that keeps the
// test process alive, and these scenarios only need what Evaluate hands to it.
function fakeEventsClient() {
  return {
    queue: [],
    evaluateEvent(featureKey, evaluatedVariant, user) {
      this.queue.push({ featureKey, evaluatedVariant, user });
    }
  };
}

// The client-level scenarios need _emitEvaluation and the EventEmitter machinery but not
// a network-backed client, so they drive the prototype methods on a bare object the same
// way evaluate() wires them together.
function clientEvaluate(world, { key, variant, value, user, listener }) {
  const client = Object.create(Featureflow.prototype);
  require('events').EventEmitter.call(client);
  client.eventsClient = fakeEventsClient();
  world.eventsClient = client.eventsClient;
  if (listener) {
    client.on('evaluation', listener);
  }
  const feature = { key, variants: [{ key: variant, value }] };
  return new Evaluate(key, variant, user, client.eventsClient, feature.variants, false,
    () => client._emitEvaluation(key, variant, user, feature));
}

defineSupportCode(({ Given, When, Then }) => {
  Given('an evaluate for feature {stringInDoubleQuotes} resolving to variant {stringInDoubleQuotes} with an evaluation listener',
    function (featureKey, evaluatedVariant) {
      this.notified = 0;
      this.eventsClient = fakeEventsClient();
      this.evaluate = new Evaluate(featureKey, evaluatedVariant, 'user-1', this.eventsClient, [], false,
        () => { this.notified++; });
    });

  When('value is read', function () {
    this.result = this.evaluate.value();
  });

  When('isOn is read', function () {
    this.result = this.evaluate.isOn();
  });

  When('jsonValue is read', function () {
    this.result = this.evaluate.jsonValue();
  });

  Then('the listener has been notified {int} times', function (count) {
    expect(this.notified).to.equal(count);
  });

  Then('the events client has recorded {int} evaluation events', function (count) {
    expect(this.eventsClient.queue.length).to.equal(count);
  });

  Given('a client evaluation of feature {stringInDoubleQuotes} as variant {stringInDoubleQuotes} with value {stringInDoubleQuotes} for user {stringInDoubleQuotes}',
    function (key, variant, valueJson, userId) {
      this.received = [];
      const evaluate = clientEvaluate(this, {
        key,
        variant,
        value: JSON.parse(valueJson),
        user: userId,
        listener: (details) => this.received.push(details)
      });
      evaluate.value();
    });

  Then('the emitted evaluation event has key {stringInDoubleQuotes}, variant {stringInDoubleQuotes}, user {stringInDoubleQuotes}',
    function (key, variant, userId) {
      expect(this.received.length).to.equal(1);
      expect(this.received[0].key).to.equal(key);
      expect(this.received[0].variant).to.equal(variant);
      expect(this.received[0].user).to.equal(userId);
    });

  Then('the emitted evaluation event value json is {stringInDoubleQuotes}', function (valueJson) {
    expect(this.received[0].value).to.deep.equal(JSON.parse(valueJson));
  });

  Given('a client evaluation of feature {stringInDoubleQuotes} as variant {stringInDoubleQuotes} with a throwing listener',
    function (key, variant) {
      const evaluate = clientEvaluate(this, {
        key, variant, value: undefined, user: 'user-1',
        listener: () => { throw new Error('broken listener'); }
      });
      this.result = evaluate.value();
    });

  Given('a client evaluation of feature {stringInDoubleQuotes} as variant {stringInDoubleQuotes} with no listeners',
    function (key, variant) {
      const evaluate = clientEvaluate(this, { key, variant, value: undefined, user: 'user-1' });
      this.result = evaluate.value();
    });

  Then('no error escaped and the evaluation still resolved to {stringInDoubleQuotes}', function (variant) {
    expect(this.result).to.equal(variant);
    // One impression was still recorded despite the listener outcome.
    expect(this.eventsClient.queue.length).to.equal(1);
  });
});
