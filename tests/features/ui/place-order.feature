@ui @place-order
Feature: Placing an order
  As a customer
  I want to place my order with my name
  So that the shop can prepare it

  Background:
    Given I open the home page

  @P1 @TC-ORD-1
  Scenario Outline: TC-ORD-1 Place Order is <state> with name <name> and <items> item(s)
    When I enter "<name>" as my name
    And I increase "Margherita Pizza" by <items>
    Then the Place Order button is <state>

    Examples:
      | name         | items | state    |
      | [blank]      | 0     | disabled |
      | [blank]      | 1     | disabled |
      | Ann          | 0     | disabled |
      | [whitespace] | 1     | disabled |
      | Ann          | 1     | enabled  |

  @P1 @TC-ORD-1
  Scenario: TC-ORD-1 Place Order is disabled again after removing items or clearing the name
    Given I enter "Ann" as my name
    And I increase "Margherita Pizza" by 1
    And the Place Order button is enabled
    When I click Remove for "Margherita Pizza"
    Then the Place Order button is disabled
    When I increase "Margherita Pizza" by 1
    Then the Place Order button is enabled
    When I enter "[blank]" as my name
    Then the Place Order button is disabled

  @P1 @TC-ORD-2
  Scenario: TC-ORD-2 Happy path
    Given I increase "Margherita Pizza" by 2
    And I increase "Pepperoni Pizza" by 1
    And I enter "Happy Path Tester" as my name
    When I place the order
    Then the order request was sent for "Happy Path Tester" with:
      | pizza            | quantity |
      | Margherita Pizza | 2        |
      | Pepperoni Pizza  | 1        |
    And a success notification shows the new order ID
    And the cart shows "Your cart is empty"
    And the name field is empty
    And the Place Order button is disabled
    And the Order ID field holds the new order ID
    And the order details show the new order ID
    And the order details show customer "Happy Path Tester" with status "RECEIVED"
    And the order details list:
      | pizza            | quantity |
      | Margherita Pizza | 2        |
      | Pepperoni Pizza  | 1        |
    And the only order actions are:
      | Mark as Delivering |
      | Cancel Order       |

  @P2 @TC-ORD-3
  Scenario: TC-ORD-3 Customer name is trimmed
    Given I increase "Margherita Pizza" by 1
    And I enter "  Ann  " as my name
    When I place the order
    Then the order details show customer "Ann" with status "RECEIVED"

  @P2 @TC-ORD-4
  Scenario: TC-ORD-4 A new order can be looked up after a reload
    Given I increase "Vegetarian Delight" by 2
    And I enter "Lookup Tester" as my name
    And I place the order
    When I reload the page
    And I look up the new order
    Then the order details show the new order ID
    And the order details show customer "Lookup Tester" with status "RECEIVED"
    And the order details list:
      | pizza              | quantity |
      | Vegetarian Delight | 2        |

  @P2 @TC-ORD-5 @mock
  Scenario: TC-ORD-5 Server rejects the order
    Given the place order API rejects orders with "Invalid order data"
    And I increase "Margherita Pizza" by 1
    And I enter "Ann" as my name
    When I place the order
    Then an error notification says "Failed to place order: Invalid order data"
    And the cart line for "Margherita Pizza" shows "Quantity: 1"
    And the name field holds "Ann"

  @P2 @TC-ORD-6 @mock
  Scenario: TC-ORD-6 Network failure while placing the order
    Given the place order API is unreachable
    And I increase "Margherita Pizza" by 1
    And I enter "Ann" as my name
    When I place the order
    Then an error notification says "Error placing order"
    And the cart line for "Margherita Pizza" shows "Quantity: 1"

  @P3 @TC-ORD-7 @D-10
  Scenario: TC-ORD-7 Double-clicking Place Order creates only one order
    Given I increase "Margherita Pizza" by 1
    And I enter "Double Click Tester" as my name
    When I double-click Place Order
    Then exactly 1 order creation request is sent

  @P3 @TC-ORD-8
  Scenario Outline: TC-ORD-8 Unusual customer name "<name>"
    Given I increase "Margherita Pizza" by 1
    And I enter "<name>" as my name
    When I place the order
    Then the order details show customer "<name>" with status "RECEIVED"
    And the page has no horizontal scroll

    Examples:
      | name                |
      | Zoë Ångström 🍕     |
      | José Müller-Łukasz  |

    # A 200 character name with no spaces used to overflow the page width (D-8)
    @D-8
    Examples: Very long name
      | name        |
      | [200 chars] |
