import { defineSupportCode } from 'cucumber';
import { expect } from 'chai';

function pendingGoal(client, goalKey) {
  return client.goals.find((g) => g.goalKey === goalKey);
}

defineSupportCode(({ When, Then }) => {
  When('goal {stringInDoubleQuotes} is tracked for user {stringInDoubleQuotes}', function (goalKey, userId) {
    this.eventsClient.trackEvent(goalKey, { id: userId });
  });

  When('goal {stringInDoubleQuotes} is tracked for user {stringInDoubleQuotes} with value {float}', function (goalKey, userId, value) {
    this.eventsClient.trackEvent(goalKey, { id: userId }, value);
  });

  When('goal {stringInDoubleQuotes} is tracked for user {stringInDoubleQuotes} with details', function (goalKey, userId, docString) {
    this.eventsClient.trackEvent(goalKey, { id: userId }, JSON.parse(docString));
  });

  Then('the pending goals should contain {int} events', function (count) {
    expect(this.eventsClient.goals).to.have.lengthOf(count);
  });

  Then('the pending goal {stringInDoubleQuotes} should have user {stringInDoubleQuotes}', function (goalKey, userId) {
    const goal = pendingGoal(this.eventsClient, goalKey);
    expect(goal, `pending goal ${goalKey}`).to.not.equal(undefined);
    expect(goal.type).to.equal('goal');
    expect(goal.user.id).to.equal(userId);
    expect(goal.timestamp).to.be.a('string');
  });

  function assertGoalValue(client, goalKey, value) {
    const goal = pendingGoal(client, goalKey);
    expect(goal, `pending goal ${goalKey}`).to.not.equal(undefined);
    expect(goal.value).to.equal(value);
  }

  // Both numeric forms: this cucumber's {float} does not match integer literals.
  Then('the pending goal {stringInDoubleQuotes} should have value {float}', function (goalKey, value) {
    assertGoalValue(this.eventsClient, goalKey, value);
  });

  Then('the pending goal {stringInDoubleQuotes} should have value {int}', function (goalKey, value) {
    assertGoalValue(this.eventsClient, goalKey, value);
  });

  Then('the pending goal {stringInDoubleQuotes} should have data', function (goalKey, docString) {
    const goal = pendingGoal(this.eventsClient, goalKey);
    expect(goal, `pending goal ${goalKey}`).to.not.equal(undefined);
    expect(goal.data).to.deep.equal(JSON.parse(docString));
  });

  Then('the batch should include a goal event {stringInDoubleQuotes} with type {stringInDoubleQuotes} and no featureKey', function (goalKey, type) {
    const row = this.receivedRequests[0].body.find((e) => e.goalKey === goalKey);
    expect(row, `batch row for goal ${goalKey}`).to.not.equal(undefined);
    expect(row.type).to.equal(type);
    expect(row).to.not.have.property('featureKey');
  });
});
