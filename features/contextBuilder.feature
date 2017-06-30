Feature: ContextBuilder
  Scenario: Test the Context Builder can build a valid context with a key
    Given there is access to the Context Builder module
    When the builder is initialised with the key "context"
    And the context is built using the builder
    Then the result context should have a key "context"
    And the result context should have no values

  Scenario: Test the Context Builder can build a valid context with a key
    Given there is access to the Context Builder module
    When the builder is initialised with the key "context"
    And the builder is given the following values
      | key  | value  |
      | age  | 21     |
      | type | beta   |
    And the context is built using the builder
    Then the result context should have a key "context"
    And the result context should have a value with key "age" and value "21"
    And the result context should have a value with key "type" and value "beta"
    And the result context should have a value with key "featureflow.key" and value "context"
    And the result context should have a value with key "featureflow.date" and current datetime in iso8601

  Scenario: Test the Context Builder throws an error when no key is provided
    Given there is access to the Context Builder module
    When the builder is initialised with the key ""
    Then the builder should throw an error
