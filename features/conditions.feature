Feature: Conditions
Scenario Outline: Test the "<operator>" operator returns a "<result>" result for a string (target: "<target>", value: "<value>", operator: "<operator>", result: "<result>")
  Given the target is a "string" with the value of "<target>"
  And the attribute is a "string" with the value of "<attribute>"
  When the operator test "<operator>" is run
  Then the output should equal "<result>"

  Examples:
    | operator        | target        | attribute              | result |
    | equals          | my-test-value | my-test-value          | true   |
    | equals          | my-test-value | not-my-test-value      | false  |
    | equals          | 98            | 98                     | true   |
    | equals          | 98            | 10                     | false  |

    | contains        | my-test-value | -test-v                | true   |
    | contains        | my-test-value | nope                   | false  |
    | contains        | my-test-value | my-test-value          | true   |
    | contains        | my-test-value | my-test-value-two      | false  |

    | startsWith      | my-test-value | my-test                | true   |
    | startsWith      | my-test-value | -test-v                | false  |
    | startsWith      | my-test-value | my-test-value          | true   |
    | startsWith      | my-test-value | my-test-value-two      | false  |

    | endsWith        | my-test-value | test-value             | true   |
    | endsWith        | my-test-value | -test-v                | false  |
    | endsWith        | my-test-value | my-test-value          | true   |
    | endsWith        | my-test-value | long-my-test-value     | false  |

    | matches         | my-test-value | my.test.+              | true   |
    | matches         | my-test-value | wont-match             | false  |
    | matches         | my-test-value | ^[A-z\-]+$             | true   |
    | matches         | my-test-value | ^[A-z]+$               | false  |

    | fakeOperator    | my-test-value | doesn't matter         | false  |



  Scenario Outline: Test the "<operator>" operator returns a "<result>" result for an array of strings (target: "<target>", values: "<values>", operator: "<operator>", result: "<result>")
    Given the target is a "string" with the value of "<target>"
    And the attribute is an array of values "<attributes>"
    When the operator test "<operator>" is run
    Then the output should equal "<result>"

    Examples:
      | operator       | target        | attributes                 | result |
      | in             | two           | one, two, three        | true   |
      | in             | four          | one, two, three        | false  |
      | notIn          | four          | one, two, three        | true   |
      | notIn          | two           | one, two, three        | false  |

  Scenario Outline: Test the "<operator>" operator returns a "<result>" result for a number  (target: "<target>", value: "<value>", operator: "<operator>", result: "<result>")
    Given the target is a "number" with the value of "<target>"
    And the attribute is a "number" with the value of "<attribute>"
    When the operator test "<operator>" is run
    Then the output should equal "<result>"

    Examples:
      | operator           | target        | attribute                  | result |
      | equals             | 9000          | 9000                   | true   |
      | equals             | 9000          | 8999                   | false  |
      | equals             | 9000.1        | 9000.1                 | true   |
      | equals             | 9000.2        | 9000.1                 | false  |

      | greaterThan        | 9000          | 8999                   | true   |
      | greaterThan        | 9000          | 9001                   | false  |
      | greaterThan        | 9000          | 9000                   | false  |

      | greaterThan        | 9000.2        | 9000.1                 | true   |
      | greaterThan        | 9000.5        | 9001                   | false  |
      | greaterThan        | 9000.5        | 9000.5                 | false  |

      | greaterThanOrEqual | 9000          | 8999                   | true   |
      | greaterThanOrEqual | 9000          | 9001                   | false  |
      | greaterThanOrEqual | 9000          | 9000                   | true   |

      | greaterThanOrEqual | 9000.2        | 9000.1                 | true   |
      | greaterThanOrEqual | 9000.5        | 9001                   | false  |
      | greaterThanOrEqual | 9000.5        | 9000.5                 | true   |

      | lessThan           | 9000          | 8999                   | false  |
      | lessThan           | 9000          | 9001                   | true   |
      | lessThan           | 9000          | 9000                   | false  |

      | lessThan           | 9000.2        | 9000.1                 | false  |
      | lessThan           | 9000.5        | 9001                   | true   |
      | lessThan           | 9000.5        | 9000.5                 | false  |

      | lessThanOrEqual    | 9000          | 8999                   | false  |
      | lessThanOrEqual    | 9000          | 9001                   | true   |
      | lessThanOrEqual    | 9000          | 9000                   | true   |

      | lessThanOrEqual    | 9000.2        | 9000.1                 | false  |
      | lessThanOrEqual    | 9000.5        | 9001                   | true   |
      | lessThanOrEqual    | 9000.5        | 9000.5                 | true   |

  Scenario Outline: Test the "<operator>" operator returns a "<result>" result for a date (target: "<target>", value: "<value>", operator: "<operator>", result: "<result>")
    Given the target is a "string" with the value of "<target>"
    And the attribute is a "string" with the value of "<attribute>"
    When the operator test "<operator>" is run
    Then the output should equal "<result>"

    Examples:
      | operator           | target                   | attribute                    | result |
      | before             | 2017-03-09T02:39:46.182Z | 2017-04-09T02:39:46.182Z | true   |
      | before             | 2017-03-09T02:39:46.182Z | 2017-02-09T02:39:46.182Z | false  |
      | before             | 2017-03-09T02:39:46.182Z | 2017-03-09T02:39:46.182Z | false  |

      | after              | 2017-03-09T02:39:46.182Z | 2017-04-09T02:39:46.182Z | false  |
      | after              | 2017-03-09T02:39:46.182Z | 2017-02-09T02:39:46.182Z | true   |
      | after              | 2017-03-09T02:39:46.182Z | 2017-03-09T02:39:46.182Z | false  |