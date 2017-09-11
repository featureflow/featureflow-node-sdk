Feature: UserBuilder
  Scenario: Test the User Builder can build a valid user with an id
    Given there is access to the User Builder module
    When the builder is initialised with the id "user"
    And the user is built using the builder
    Then the result user should have an id "user"
    And the result user should have no values

  Scenario: Test the User Builder can build a valid user with an id
    Given there is access to the User Builder module
    When the builder is initialised with the id "user"
    And the builder is given the following values
      | key  | value  |
      | age  | 21     |
      | type | beta   |
    And the user is built using the builder
    Then the result user should have an id "user"
    And the result user should have a value with key "age" and value "21"
    And the result user should have a value with key "type" and value "beta"
    And the result user should have a value with key "featureflow.key" and value "user"
    And the result user should have a value with key "featureflow.date" and current datetime in iso8601

  Scenario: Test the User Builder throws an error when no key is provided
    Given there is access to the User Builder module
    When the builder is initialised with the id ""
    Then the builder should throw an error
