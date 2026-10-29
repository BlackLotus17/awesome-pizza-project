@ui @menu
Feature: Page load and menu
  As a customer
  I want to see today's menu when I open Awesome Pizza
  So that I can choose what to order

  @P1 @TC-MENU-1
  Scenario: TC-MENU-1 Home page shows the header and all sections
    Given I open the home page
    Then the page title is "Awesome Pizza - Order Online"
    And the header shows "🍕 Awesome Pizza" with subtitle "Delicious pizzas delivered to your door!"
    And the theme toggle is visible
    And the "🔒 Login" link is visible
    And these sections are visible:
      | Today's Menu     |
      | Your Order       |
      | Order Management |

  @P1 @TC-MENU-2
  Scenario: TC-MENU-2 Menu renders from the API
    Given I open the home page
    Then the menu shows exactly these pizzas in this order:
      | Margherita Pizza   |
      | Pepperoni Pizza    |
      | Quattro Stagioni   |
      | Vegetarian Delight |
      | BBQ Chicken Pizza  |
    And every menu card shows the name and description from the daily menu API
    And every menu image has the pizza name as its alt text
    And every menu card shows quantity 0 with "−" and "+" buttons

  @P2 @TC-MENU-3
  Scenario: TC-MENU-3 Menu images load
    Given I open the home page
    Then every menu image has loaded

  @P3 @TC-MENU-4 @mock
  Scenario: TC-MENU-4 A broken menu image falls back to the placeholder
    Given the menu image "assets/origs/pepperoni.png" is missing
    When I open the home page
    Then the "Pepperoni Pizza" image shows the placeholder image

  @P2 @TC-MENU-5 @mock
  Scenario Outline: TC-MENU-5 Menu API fails with <failure>
    Given the daily menu API returns <failure>
    When I open the home page without waiting for the menu
    Then an error notification says "Failed to load menu"
    And no menu cards are shown
    And the page is still usable

    Examples:
      | failure       |
      | server error  |
      | success false |

  @P2 @TC-MENU-6 @mock
  Scenario: TC-MENU-6 Menu API network error
    Given the daily menu API returns network error
    When I open the home page without waiting for the menu
    Then an error notification says "Error loading menu"
    And no menu cards are shown

  @P1 @TC-MENU-7
  Scenario: TC-MENU-7 Initial order form state
    Given I open the home page
    Then the cart shows "Your cart is empty"
    And the total items is 0
    And the Place Order button is disabled
    And the order details are hidden

  @P2 @TC-MENU-8
  Scenario: TC-MENU-8 No unexpected console errors on load
    Given I open the home page
    Then there are no console errors
    And there are no failed requests
