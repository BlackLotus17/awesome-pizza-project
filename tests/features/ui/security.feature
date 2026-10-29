@ui @security
Feature: Security in the browser
  As the shop owner
  I want user-supplied text to be shown safely
  So that nobody can run scripts in staff browsers

  @P1 @TC-SEC-1 @D-6
  Scenario: TC-SEC-1 Customer name is not executed as HTML
    Given I have an order for customer "<img src=x onerror=\"window.__xss=1\">" created via the API
    And I open the home page
    When I look up the new order
    Then the order details show customer "<img src=x onerror=\"window.__xss=1\">" as plain text
    And no injected script has run

  @P2 @TC-SEC-2
  Scenario: TC-SEC-2 Order ID lookup does not execute HTML
    Given I open the home page
    When I look up order "<img src=x onerror=\"window.__xss=1\">" with the button
    Then an error notification is shown
    And no injected script has run

  @P3 @TC-SEC-3
  Scenario: TC-SEC-3 Password field is masked and credentials are sent in the body
    Given I open the login page
    Then the password field is masked
    When I log in as "user" with password "pass" using the button
    Then the login request sent the credentials in the body, not the URL
