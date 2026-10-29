@ui @order-management
Feature: Order lookup and status lifecycle
  As shop staff
  I want to look up orders and move them through their lifecycle
  So that customers know where their pizza is

  Seeded orders are read-only. Scenarios that change a status create their own order.

  @P1 @TC-ORD-LU-1
  Scenario: TC-ORD-LU-1 Look up a seeded order with the button
    Given I open the home page
    When I look up order "order-002" with the button
    Then a success notification says "Order found"
    And the order details show customer "Jane Smith" with status "DELIVERING"
    And the order details list:
      | pizza              | quantity |
      | Vegetarian Delight | 1        |
      | BBQ Chicken Pizza  | 1        |
    And the only order actions are:
      | Mark as Delivered |

  @P2 @TC-ORD-LU-2
  Scenario: TC-ORD-LU-2 Look up an order with Enter
    Given I open the home page
    When I look up order "order-002" with Enter
    Then a success notification says "Order found"
    And the order details show customer "Jane Smith" with status "DELIVERING"

  @P1 @TC-ORD-LU-3
  Scenario: TC-ORD-LU-3 Unknown order ID
    Given I open the home page
    When I look up order "order-does-not-exist" with the button
    Then an error notification says "Order not found: Order with ID 'order-does-not-exist' not found"
    And the order details are hidden

  @P1 @TC-ORD-LU-3
  Scenario: TC-ORD-LU-3 Unknown order ID hides the previously shown order
    Given I open the home page
    And I look up order "order-002" with the button
    And the order details are visible
    When I look up order "order-does-not-exist" with the button
    Then an error notification says "Order not found: Order with ID 'order-does-not-exist' not found"
    And the order details are hidden

  @P2 @TC-ORD-LU-4
  Scenario Outline: TC-ORD-LU-4 Order ID is <value>
    Given I open the home page
    When I look up order "<value>" with the button
    Then an error notification says "Please enter an order ID"
    And no order lookup request was sent

    Examples:
      | value        |
      | [blank]      |
      | [whitespace] |

  @P3 @TC-ORD-LU-5
  Scenario: TC-ORD-LU-5 Order ID is trimmed before lookup
    Given I open the home page
    When I look up order "  order-002  " with the button
    Then a success notification says "Order found"
    And the order details show customer "Jane Smith" with status "DELIVERING"

  @P3 @TC-ORD-LU-6 @D-7
  Scenario Outline: TC-ORD-LU-6 Order ID containing "<character>" gives a clean not-found message
    Given I open the home page
    When I look up order "<id>" with the button
    Then an error notification says "Order not found: Order with ID '<id>' not found"

    Examples:
      | character | id         |
      | /         | abc/def    |
      | ?         | abc?x=1    |
      | #         | abc#frag   |

  @P1 @TC-ORD-LU-7
  Scenario: TC-ORD-LU-7 RECEIVED to DELIVERING to DELIVERED
    Given I have an order with status "RECEIVED" created via the API
    And I open the home page
    And I look up the new order
    When I click the order action "Mark as Delivering"
    Then a status update request was sent with status "DELIVERING"
    And the status badge shows "DELIVERING"
    And a success notification says "Order status updated to DELIVERING"
    And the only order actions are:
      | Mark as Delivered |
    When I click the order action "Mark as Delivered"
    Then a status update request was sent with status "DELIVERED"
    And the status badge shows "DELIVERED"
    And a success notification says "Order status updated to DELIVERED"
    And there are no order actions

  @P1 @TC-ORD-LU-8
  Scenario: TC-ORD-LU-8 RECEIVED to CANCELED
    Given I have an order with status "RECEIVED" created via the API
    And I open the home page
    And I look up the new order
    When I click the order action "Cancel Order"
    Then a status update request was sent with status "CANCELED"
    And the status badge shows "CANCELED"
    And a success notification says "Order status updated to CANCELED"
    And there are no order actions

  @P2 @TC-ORD-LU-9
  Scenario: TC-ORD-LU-9 Status survives a reload
    Given I have an order with status "RECEIVED" created via the API
    And I open the home page
    And I look up the new order
    And I click the order action "Mark as Delivering"
    When I reload the page
    And I look up the new order
    Then the status badge shows "DELIVERING"

  @P2 @TC-ORD-LU-10
  Scenario Outline: TC-ORD-LU-10 Status badge styling for <status>
    Given I have an order with status "<status>" created via the API
    And I open the home page
    When I look up the new order
    Then the status badge shows "<status>"
    And the status badge has the class "<class>"

    Examples:
      | status     | class             |
      | RECEIVED   | status-received   |
      | DELIVERING | status-delivering |
      | DELIVERED  | status-delivered  |
      | CANCELED   | status-canceled   |

  @P2 @TC-ORD-LU-11 @mock
  Scenario Outline: TC-ORD-LU-11 Status update fails because the API is <failure>
    Given I have an order with status "RECEIVED" created via the API
    And the status update API is <failure>
    And I open the home page
    And I look up the new order
    When I click the order action "Mark as Delivering"
    Then an error notification says "<message>"
    And the status badge shows "RECEIVED"

    Examples:
      | failure     | message                                    |
      | rejecting   | Failed to update order: Update not allowed |
      | unreachable | Error updating order status                |

  @P3 @TC-ORD-LU-12
  Scenario Outline: TC-ORD-LU-12 Read-only lookup of seeded order <id>
    Given I open the home page
    When I look up order "<id>" with the button
    Then the order details show customer "<customer>" with status "<status>"
    And the order details include "<pizza1>" with quantity <qty1>
    And the order actions are "<actions>"

    Examples:
      | id        | customer     | status    | pizza1           | qty1 | actions                          |
      | order-001 | John Doe     | RECEIVED  | Margherita Pizza | 2    | Mark as Delivering, Cancel Order |
      | order-003 | Mike Johnson | DELIVERED | Quattro Stagioni | 3    | none                             |
