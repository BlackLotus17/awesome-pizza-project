@ui @auth
Feature: Login and protected area
  As a staff member
  I want to log in
  So that I can see the protected staff data

  @P1 @TC-AUTH-1
  Scenario: TC-AUTH-1 Login link on the home page opens the login page
    Given I open the home page
    When I click the "🔒 Login" link
    Then I am on "/login.html"
    And the page title is "Awesome Pizza - Login"
    And the login hint says "Hint: use user / pass"

  @P1 @TC-AUTH-2
  Scenario: TC-AUTH-2 Valid login with the button
    Given I open the login page
    When I log in as "user" with password "pass" using the button
    Then I am on "/protected.html"
    And an auth token is saved
    And the protected page shows these cards:
      | label          | value                                                     |
      | Secret Recipes | Margherita Supreme, Dragon Pepperoni, Black Truffle Delight |
      | Staff Discount | 50% off all pizzas                                        |
      | VIP Code       | PIZZA-VIP-2024                                            |
      | Delivery Note  | Drivers use entrance B                                    |
    And the Logout button is visible

  @P2 @TC-AUTH-3
  Scenario: TC-AUTH-3 Valid login with Enter in the password field
    Given I open the login page
    When I log in as "user" with password "pass" using Enter
    Then I am on "/protected.html"
    And an auth token is saved
    And the protected page shows 4 cards

  @P1 @TC-AUTH-4
  Scenario Outline: TC-AUTH-4 Login fails with <case>
    Given I open the login page
    When I log in as "<username>" with password "<password>" using the button
    Then the login error says "Invalid username or password"
    And I am on "/login.html"
    And no auth token is saved

    Examples:
      | case           | username | password |
      | wrong password | user     | wrong    |
      | unknown user   | nobody   | pass     |
      | empty fields   | [blank]  | [blank]  |

  @P3 @TC-AUTH-5
  Scenario: TC-AUTH-5 Username is trimmed
    Given I open the login page
    When I log in as "  user  " with password "pass" using the button
    Then I am on "/protected.html"

  @P3 @TC-AUTH-5
  Scenario: TC-AUTH-5 Password is not trimmed
    Given I open the login page
    When I log in as "user" with password " pass" using the button
    Then the login error says "Invalid username or password"

  @P3 @TC-AUTH-6 @mock
  Scenario: TC-AUTH-6 Error message clears when a new attempt starts
    Given I open the login page
    And I log in as "user" with password "wrong" using the button
    And the login error says "Invalid username or password"
    And the login API responds slowly
    When I log in as "user" with password "wrong" using the button
    Then the login error is hidden while the request is in flight

  @P2 @TC-AUTH-7 @mock
  Scenario: TC-AUTH-7 Login API unreachable
    Given the login API is unreachable
    And I open the login page
    When I log in as "user" with password "pass" using the button
    Then the login error says "Login failed — server unreachable"
    And no auth token is saved

  @P2 @TC-AUTH-8
  Scenario: TC-AUTH-8 Already logged in users skip the login page
    Given I am logged in
    When I open the login page
    Then I am on "/protected.html"

  @P1 @TC-AUTH-9
  Scenario: TC-AUTH-9 Logout
    Given I am logged in
    And I open the protected page
    When I log out
    Then I am on "/login.html"
    And no auth token is saved
    When I open the protected page
    Then the protected page shows the logged-out view

  @P1 @TC-AUTH-10
  Scenario: TC-AUTH-10 Protected page when logged out
    When I open the protected page
    Then the protected page shows the logged-out view
    And the login-required message links to "login.html"

  @P1 @TC-AUTH-10 @D-4
  Scenario: TC-AUTH-10 Protected page when logged out does not claim the user is logged in
    When I open the protected page
    Then the text "Welcome! You are logged in" is not shown

  @P1 @TC-AUTH-11
  Scenario: TC-AUTH-11 Invalid or expired token in storage
    Given an invalid auth token "expired-token" is saved
    When I open the protected page
    Then I am on "/login.html"
    And no auth token is saved

  @P2 @TC-AUTH-12 @mock
  Scenario Outline: TC-AUTH-12 Protected API <failure>
    Given I am logged in
    And the protected API returns <failure>
    When I open the protected page
    Then the protected area says "Failed to load protected data."

    Examples:
      | failure       |
      | server error  |
      | network error |
