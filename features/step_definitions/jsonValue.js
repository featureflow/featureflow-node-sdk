import { defineSupportCode } from 'cucumber';
import { expect } from 'chai';
import Evaluate from '../../src/Evaluate';

// A minimal double for EventsClient: real EventsClient starts a setInterval timer that would
// otherwise keep the test process alive. This captures exactly what Evaluate hands to events,
// which is what these scenarios need to assert on anyway.
function fakeEventsClient() {
  return {
    queue: [],
    evaluateEvent(featureKey, evaluatedVariant, user) {
      this.queue.push({ featureKey, evaluatedVariant, user });
    }
  };
}

defineSupportCode(({ Given, When, Then }) => {
  Given('the feature {stringInDoubleQuotes} evaluates to variant {stringInDoubleQuotes} with variants', function (featureKey, evaluatedVariant, table) {
    const variants = table.hashes().map((row) => ({
      key: row.key,
      value: row.value ? JSON.parse(row.value) : undefined
    }));
    this.eventsClient = fakeEventsClient();
    this.evaluate = new Evaluate(featureKey, evaluatedVariant, 'user-1', this.eventsClient, variants);
  });

  Given('the feature {stringInDoubleQuotes} evaluates to variant {stringInDoubleQuotes} with no variants', function (featureKey, evaluatedVariant) {
    this.eventsClient = fakeEventsClient();
    this.evaluate = new Evaluate(featureKey, evaluatedVariant, 'user-1', this.eventsClient);
  });

  When('jsonValue is called', function () {
    this.result = this.evaluate.jsonValue();
  });

  When('value is called', function () {
    this.result = this.evaluate.value();
  });

  Then('the json value should equal', function (docString) {
    expect(this.result).to.deep.equal(JSON.parse(docString));
  });

  Then('the json value should be undefined', function () {
    expect(this.result).to.equal(undefined);
  });

  Then('the result should be {stringInDoubleQuotes}', function (expected) {
    expect(this.result).to.equal(expected);
  });

  Then('an evaluate event should be queued with featureKey {stringInDoubleQuotes} and evaluatedVariant {stringInDoubleQuotes}', function (featureKey, evaluatedVariant) {
    expect(this.eventsClient.queue).to.have.lengthOf(1);
    expect(this.eventsClient.queue[0].featureKey).to.equal(featureKey);
    expect(this.eventsClient.queue[0].evaluatedVariant).to.equal(evaluatedVariant);
  });

  Then('the queued event should only have keys {stringInDoubleQuotes}', function (expectedKeysCsv) {
    const expectedKeys = expectedKeysCsv.split(',').map((k) => k.trim()).sort();
    expect(Object.keys(this.eventsClient.queue[0]).sort()).to.deep.equal(expectedKeys);
    expect(this.eventsClient.queue[0]).to.not.have.property('value');
    expect(this.eventsClient.queue[0]).to.not.have.property('jsonValue');
  });
});
