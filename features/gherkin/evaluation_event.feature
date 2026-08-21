Feature: Evaluation event
  The client emits an 'evaluation' event whenever an evaluation is recorded — the same
  moments an impression is counted — so exposures can be forwarded to any external
  analytics or experimentation tool. Node-only feature file: the shared testbed does not
  cover emitter hooks.

  Scenario: reading a variant fires the evaluation hook once per read
    Given an evaluate for feature "checkout-v2" resolving to variant "on" with an evaluation listener
    When value is read
    Then the listener has been notified 1 times
    And the events client has recorded 1 evaluation events

  Scenario: every accessor fires the hook, in step with impression recording
    Given an evaluate for feature "checkout-v2" resolving to variant "on" with an evaluation listener
    When value is read
    And isOn is read
    And jsonValue is read
    Then the listener has been notified 3 times
    And the events client has recorded 3 evaluation events

  Scenario: building an evaluate without reading it fires nothing
    Given an evaluate for feature "checkout-v2" resolving to variant "on" with an evaluation listener
    Then the listener has been notified 0 times
    And the events client has recorded 0 evaluation events

  Scenario: the emitted event carries the key, variant, JSON value and user
    Given a client evaluation of feature "checkout-v2" as variant "on" with value "[1,2,3]" for user "user-1"
    Then the emitted evaluation event has key "checkout-v2", variant "on", user "user-1"
    And the emitted evaluation event value json is "[1,2,3]"

  Scenario: a throwing listener never breaks evaluation
    Given a client evaluation of feature "checkout-v2" as variant "on" with a throwing listener
    Then no error escaped and the evaluation still resolved to "on"

  Scenario: with no listeners the hook costs nothing and evaluation is unchanged
    Given a client evaluation of feature "checkout-v2" as variant "on" with no listeners
    Then no error escaped and the evaluation still resolved to "on"
