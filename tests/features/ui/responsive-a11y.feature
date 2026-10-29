@ui @responsive-a11y
Feature: Responsive layout and accessibility
  As any customer, on any device and with any input method
  I want to be able to use Awesome Pizza
  So that nobody is left out

  @P2 @TC-RWD-1 @mobile
  Scenario: TC-RWD-1 Mobile width (375 px)
    Given the browser window is 375 by 812 pixels
    And I open the home page
    Then the page has no horizontal scroll
    And the menu cards are stacked in one column
    When I increase "Margherita Pizza" by 1
    And I enter "Mobile Tester" as my name
    And I place the order
    Then a success notification shows the new order ID
    And the order details show customer "Mobile Tester" with status "RECEIVED"

  @P3 @TC-RWD-2
  Scenario: TC-RWD-2 Tablet width (768 px)
    Given the browser window is 768 by 1024 pixels
    And I open the home page
    Then the page has no horizontal scroll
    And the menu grid wraps onto more than one row
    And no menu card text is clipped

  @P2 @TC-A11Y-1 @skip-webkit
  Scenario: TC-A11Y-1 Keyboard-only order journey
    Given I open the home page
    When I press Tab until the "+" button of "Margherita Pizza" is focused
    Then the focused element has a visible focus indicator
    When I press "Enter"
    Then the "Margherita Pizza" card shows quantity 1
    When I press Tab until the "Your Name:" field is focused
    And I type "Keyboard Tester"
    And I press Tab until the "Place Order" button is focused
    Then the focused element has a visible focus indicator
    When I press "Space"
    Then a success notification shows the new order ID

  @P2 @TC-A11Y-2
  Scenario Outline: TC-A11Y-2 Inputs on <page> are reachable by their label
    Given I open the <page>
    Then these fields can be found by their label:
      | <label1> |
      | <label2> |
    And the theme toggle has the accessible name "Toggle dark theme"

    Examples:
      | page       | label1     | label2    |
      | home page  | Your Name: | Order ID: |
      | login page | Username:  | Password: |

  # The orange (#ff6b35) headings and Login button used to fail colour contrast (D-9)
  @P3 @TC-A11Y-3 @axe @D-9
  Scenario Outline: TC-A11Y-3 Automated accessibility scan of <page>
    Given I open the <page>
    Then an axe scan finds no serious or critical violations

    Examples:
      | page           |
      | home page      |
      | login page     |
      | protected page |
