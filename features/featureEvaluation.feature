Feature: Feature Evaluation
  Scenario: Test that a disabled feature returns the offVariantKey
    Given the feature "my-feature" with an offVariantKey "off", a default key of "on" is disabled
    When the feature is evaluated with a user "user"
    Then the evaluated variant should be "off"

  Scenario: Test that an enabled feature does not return the offVariantKey
    Given the feature "my-feature" with an offVariantKey "off", a default key of "on" is enabled
    When the feature is evaluated with a user "user"
    Then the evaluated variant should be "on"