@integration
Feature: Integration
  Scenario Outline: Test that we can instantiate the client
    Given there is access to the Featureflow library
    And the FeatureflowClient is initialized with the apiKey "srv-env-9b5fff890c724d119a334a64ed4d2eb2"
    When the feature "<feature>" with context key "<key>" is evaluated with the value "<value>"
    Then the result of the evaluation should equal <result>
    Examples:
      | feature          | key   | value | result  |
      | test-integration | user1 | on    | true    |
      | test-integration | user2 | on    | false   |
      | test-integration | user1 | off   | false   |
      | test-integration | user2 | off   | true    |

  Scenario Outline: Test that the client will throw an error when the wrong key is used
    Given there is access to the Featureflow library
    And the FeatureflowClient is initialized with the apiKey "notvalid"
    When the feature "<feature>" with context key "<key>" is evaluated with the value "<value>"
    Then the result of the evaluation should equal <result>
    Examples:
      | feature          | key   | value | result  |
      | test-integration | user1 | on    | false   |

  Scenario: Test that the client will throw an error when no key is supplied
    Given there is access to the Featureflow library
    When the FeatureflowClient is initialized with no apiKey
    Then the featureflow client should throw an error
