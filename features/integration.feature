@integration
Feature: Integration
  Scenario Outline: Test that we can instantiate the client
    Given there is access to the Featureflow library
    When the FeatureflowClient is initialized with the apiKey "<apiKey>"
    Then it should return a featureflow client
    And there should not be an error
    And it should be able to evaluate a rule
  Examples:
    | apiKey                                                                                                                                                                                        |
    | eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI1OGM1ZjUwZTAzNjBkNjAwMGM0NTdlMTEiLCJhdXRoIjoiUk9MRV9FTlZJUk9OTUVOVCJ9.nv6xO-_Tb4wFmll1njK4SD6gBTyx4SngOHPSKtU0LHTtX9yPjFKWEZB4bPvYzI1k-Zna0E77Fd15wD6QnFin2g  |

  Scenario: Test that the client will throw an error when the wrong key is used
    Given there is access to the Featureflow library
    When the FeatureflowClient is initialized with the apiKey "notvalid"
    Then it should not return a featureflow client
    And there should be an error