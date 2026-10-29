@ui @notifications
Feature: Notifications
  As a user
  I want clear feedback after each action
  So that I know whether it worked

  @P2 @TC-NOTE-1
  Scenario Outline: TC-NOTE-1 <type> notification styling
    Given I open the home page
    When I look up order "<id>" with the button
    Then the notification is visible with the "<type>" style

    Examples:
      | type    | id                   |
      | success | order-002            |
      | error   | order-does-not-exist |

  @P3 @TC-NOTE-2
  Scenario: TC-NOTE-2 Notification hides itself after 3 seconds
    Given the browser clock is controlled by the test
    And I open the home page
    When I look up order "order-002" with the button
    Then the notification is visible with the "success" style
    When 2900 milliseconds pass
    Then the notification is still visible
    When 200 milliseconds pass
    Then the notification is hidden
