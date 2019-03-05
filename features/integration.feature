@integration
Feature: Integration
  Scenario Outline: Test that we can instantiate the client
    Given there is access to the Featureflow library
    And the FeatureflowClient is initialized with the apiKey "srv-env-2e00afab61d14c33aba414e4c63bc07f"
    When the feature "<feature>" with user id "<id>" is evaluated with the value "<value>"
    Then the result of the evaluation should equal <result>
    Examples:
      | feature          | id    | value | result  |
      | test-integration | user1 | on    | true    |
      | test-integration | user2 | on    | false   |
      | test-integration | user1 | off   | false   |
      | test-integration | user2 | off   | true    |

  Scenario Outline: Test that the client will throw an error when the wrong key is used
    Given there is access to the Featureflow library
    And the FeatureflowClient is initialized with the apiKey "notvalid"
    When the feature "<feature>" with user id "<id>" is evaluated with the value "<value>"
    Then the result of the evaluation should equal <result>
    Examples:
      | feature          | id   | value  | result  |
      | test-integration | user1 | on    | false   |

  Scenario: Test that the client will throw an error when no key is supplied
    Given there is access to the Featureflow library
    When the FeatureflowClient is initialized with no apiKey
    Then the featureflow client should throw an error
