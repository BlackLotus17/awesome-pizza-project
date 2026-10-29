@ui @cart
Feature: Cart
  As a customer
  I want to change pizza quantities in my cart
  So that I order exactly what I want

  Background:
    Given I open the home page

  @P1 @TC-CART-1
  Scenario: TC-CART-1 Adding one pizza
    When I increase "Margherita Pizza" by 1
    Then the "Margherita Pizza" card shows quantity 1
    And the cart line for "Margherita Pizza" shows "Quantity: 1"
    And the total items is 1
    And the empty cart message is not shown

  @P1 @TC-CART-2
  Scenario: TC-CART-2 Adding several pizzas several times
    When I increase the pizzas by:
      | pizza             | quantity |
      | Pepperoni Pizza   | 2        |
      | Quattro Stagioni  | 1        |
      | Margherita Pizza  | 3        |
    Then the cart contains, in this order:
      | pizza            | quantity |
      | Pepperoni Pizza  | 2        |
      | Quattro Stagioni | 1        |
      | Margherita Pizza | 3        |
    And the menu cards show:
      | pizza            | quantity |
      | Pepperoni Pizza  | 2        |
      | Quattro Stagioni | 1        |
      | Margherita Pizza | 3        |
    And the total items is 6

  @P2 @TC-CART-3
  Scenario: TC-CART-3 Minus reduces the quantity
    Given I increase "Margherita Pizza" by 3
    When I decrease "Margherita Pizza" by 1
    Then the "Margherita Pizza" card shows quantity 2
    And the cart line for "Margherita Pizza" shows "Quantity: 2"
    And the total items is 2

  @P2 @TC-CART-4
  Scenario: TC-CART-4 Minus down to zero removes the item
    Given I increase "Margherita Pizza" by 2
    And I increase "Pepperoni Pizza" by 1
    When I decrease "Pepperoni Pizza" by 1
    Then the cart does not contain "Pepperoni Pizza"
    And the empty cart message is not shown
    When I decrease "Margherita Pizza" by 2
    Then the cart does not contain "Margherita Pizza"
    And the cart shows "Your cart is empty"
    And the total items is 0

  @P2 @TC-CART-5
  Scenario: TC-CART-5 Minus on a pizza with quantity 0 does nothing
    When I decrease "Margherita Pizza" by 1
    Then the "Margherita Pizza" card shows quantity 0
    And the cart does not contain "Margherita Pizza"
    And the total items is 0
    And the cart shows "Your cart is empty"

  @P1 @TC-CART-6
  Scenario: TC-CART-6 Remove button clears the item whatever its quantity
    Given I increase "Margherita Pizza" by 3
    And I increase "Pepperoni Pizza" by 1
    When I click Remove for "Margherita Pizza"
    Then the cart does not contain "Margherita Pizza"
    And the "Margherita Pizza" card shows quantity 0
    And the total items is 1

  @P3 @TC-CART-7
  Scenario: TC-CART-7 Large quantity
    When I increase "BBQ Chicken Pizza" by 25
    Then the "BBQ Chicken Pizza" card shows quantity 25
    And the cart line for "BBQ Chicken Pizza" shows "Quantity: 25"
    And the total items is 25
    And the page has no horizontal scroll

  @P3 @TC-CART-8
  Scenario: TC-CART-8 Cart is not saved across reloads
    Given I increase "Margherita Pizza" by 2
    When I reload the page
    Then the cart shows "Your cart is empty"
    And the total items is 0
