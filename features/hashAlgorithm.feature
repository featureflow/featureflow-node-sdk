Feature: Hashing Algorithm
  Scenario Outline: Testing that the key "<key>", salt "<salt>" and feature "<feature>" returns the result "<result>"
    Given the salt is "<salt>", the feature is "<feature>" and the key is "<key>"
    When the variant value is calculated
    Then the hash value calculated should equal "<hash>"
    And the result from the variant calculation should be <result>


    Examples:
      | salt  | feature   | key        | result | hash             |
      | 1     | f1        | alice      | 41     | de5ce0fbc583fd8c |
      | 1     | f1        | bob        | 10     | 8ecddc9f392dc351 |
      | 2     | f1        | alice      | 32     | e31eff9e88214f2b |
      | 2     | f1        | bob        | 16     | 591e96e46fc1dad3 |
      | 3     | f1        | alice      | 76     | 05ad8a286f0b0bbf |
      | 3     | f1        | bob        | 26     | 9bc2af62801255d9 |