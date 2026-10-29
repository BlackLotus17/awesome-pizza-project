@api @orders-api
Feature: Orders API
  Scenarios that change data create their own order. Seeded orders are only read.

  @P1 @TC-API-2
  Scenario: TC-API-2 Get a seeded order
    When I send a GET request to "/api/orders/order-001"
    Then the response status is 200
    And the response field "data" equals:
      """
      {
        "id": "order-001",
        "sender": "John Doe",
        "status": "RECEIVED",
        "contents": [
          { "name": "Margherita Pizza", "quantity": 2 },
          { "name": "Pepperoni Pizza", "quantity": 1 }
        ]
      }
      """

  @P1 @TC-API-3
  Scenario: TC-API-3 Get an unknown order
    When I send a GET request to "/api/orders/order-unknown-123"
    Then the response status is 404
    And the response field "error" is "Not found"
    And the response field "message" contains "order-unknown-123"

  @P1 @TC-API-4
  Scenario: TC-API-4 Create a valid order
    When I send a POST request to "/api/orders" with body:
      """
      {
        "sender": "  API Tester  ",
        "contents": [
          { "name": "Margherita Pizza", "quantity": 2 },
          { "name": "BBQ Chicken Pizza", "quantity": 1 }
        ]
      }
      """
    Then the response status is 201
    And the response field "data.id" matches "^order-\d+-\d+$"
    And the response field "data.status" is "RECEIVED"
    And the response field "data.sender" is "API Tester"
    And the response field "data.contents" equals:
      """
      [
        { "name": "Margherita Pizza", "quantity": 2 },
        { "name": "BBQ Chicken Pizza", "quantity": 1 }
      ]
      """

  @P1 @TC-API-5
  Scenario Outline: TC-API-5 Create order validation: <case>
    When I send a POST request to "/api/orders" with body '<body>'
    Then the response status is 400
    And the response field "message" is "<message>"

    Examples: Invalid sender
      | case                 | body                                                                  | message                                                  |
      | missing sender       | {"contents":[{"name":"Margherita Pizza","quantity":1}]}               | Order sender is required and must be a non-empty string  |
      | empty sender         | {"sender":"","contents":[{"name":"Margherita Pizza","quantity":1}]}   | Order sender is required and must be a non-empty string  |
      | whitespace sender    | {"sender":"   ","contents":[{"name":"Margherita Pizza","quantity":1}]}| Order sender is required and must be a non-empty string  |
      | non-string sender    | {"sender":42,"contents":[{"name":"Margherita Pizza","quantity":1}]}   | Order sender is required and must be a non-empty string  |

    Examples: Invalid contents
      | case                 | body                                                   | message                                                     |
      | missing contents     | {"sender":"Ann"}                                       | Order contents are required and must be a non-empty array   |
      | non-array contents   | {"sender":"Ann","contents":"Margherita Pizza"}         | Order contents are required and must be a non-empty array   |
      | empty contents       | {"sender":"Ann","contents":[]}                         | Order contents are required and must be a non-empty array   |

    Examples: Invalid item name
      | case                 | body                                                   | message                                  |
      | missing item name    | {"sender":"Ann","contents":[{"quantity":1}]}           | Each order item must have a valid name   |
      | empty item name      | {"sender":"Ann","contents":[{"name":"","quantity":1}]} | Each order item must have a valid name   |
      | non-string item name | {"sender":"Ann","contents":[{"name":7,"quantity":1}]}  | Each order item must have a valid name   |

    Examples: Invalid quantity
      | case              | body                                                                   | message                                                       |
      | missing quantity  | {"sender":"Ann","contents":[{"name":"Margherita Pizza"}]}              | Each order item must have a valid quantity (positive number)  |
      | zero quantity     | {"sender":"Ann","contents":[{"name":"Margherita Pizza","quantity":0}]} | Each order item must have a valid quantity (positive number)  |
      | negative quantity | {"sender":"Ann","contents":[{"name":"Margherita Pizza","quantity":-1}]}| Each order item must have a valid quantity (positive number)  |
      | string quantity   | {"sender":"Ann","contents":[{"name":"Margherita Pizza","quantity":"2"}]}| Each order item must have a valid quantity (positive number) |

  @P2 @TC-API-6
  Scenario: TC-API-6 Non-JSON body is rejected without crashing the server
    When I send a POST request to "/api/orders" with the raw JSON body "this is not json"
    Then the response status is a client error
    And the server still answers GET "/api/daily-menu" with 200

  @P2 @TC-API-7
  Scenario: TC-API-7 Generated order IDs are unique
    When I create 20 orders in parallel via the API
    Then all 20 order IDs are different

  @P1 @TC-API-8
  Scenario Outline: TC-API-8 Update an order from <from> to <status>
    Given I have an order with status "<from>" created via the API
    When I send a PUT request to "/api/orders/{orderId}" with body '{"status":"<status>"}'
    Then the response status is 200
    And the response field "data.status" is "<status>"
    And the sender and contents of the order are unchanged

    Examples:
      | from       | status     |
      | RECEIVED   | RECEIVED   |
      | RECEIVED   | DELIVERING |
      | DELIVERING | DELIVERED  |
      | RECEIVED   | CANCELED   |

  @P1 @TC-API-9
  Scenario Outline: TC-API-9 Update order validation: <case>
    Given I have an order with status "RECEIVED" created via the API
    When I send a PUT request to "/api/orders/{orderId}" with body '<body>'
    Then the response status is 400
    And the response field "message" is "<message>"

    Examples:
      | case               | body                                              | message                                                        |
      | unknown status     | {"status":"SHIPPED"}                              | Status must be one of: RECEIVED, DELIVERING, DELIVERED, CANCELED |
      | lowercase status   | {"status":"delivered"}                            | Status must be one of: RECEIVED, DELIVERING, DELIVERED, CANCELED |
      | empty sender       | {"sender":""}                                     | Order sender must be a non-empty string                        |
      | empty contents     | {"contents":[]}                                   | Order contents must be a non-empty array                       |
      | invalid item       | {"contents":[{"name":"Margherita Pizza","quantity":0}]} | Each order item must have a valid quantity (positive number) |

  @P1 @TC-API-9
  Scenario: TC-API-9 Update an unknown order
    When I send a PUT request to "/api/orders/order-unknown-123" with body '{"status":"DELIVERED"}'
    Then the response status is 404
    And the response field "error" is "Not found"

  @P2 @TC-API-10
  Scenario: TC-API-10 Partial update of the sender only
    Given I have an order with status "RECEIVED" created via the API
    When I send a PUT request to "/api/orders/{orderId}" with body '{"sender":"  Renamed Customer  "}'
    Then the response status is 200
    And the response field "data.sender" is "Renamed Customer"
    And the response field "data.status" is "RECEIVED"
    And the contents of the order are unchanged

  @P2 @TC-API-10
  Scenario: TC-API-10 Empty update body changes nothing
    Given I have an order with status "RECEIVED" created via the API
    When I send a PUT request to "/api/orders/{orderId}" with body '{}'
    Then the response status is 200
    And the order is unchanged

  @P2 @TC-API-11
  Scenario: TC-API-11 Update replaces the contents
    Given I have an order with status "RECEIVED" created via the API
    When I send a PUT request to "/api/orders/{orderId}" with body '{"contents":[{"name":"Quattro Stagioni","quantity":4}]}'
    Then the response status is 200
    And the response field "data.contents" equals:
      """
      [{ "name": "Quattro Stagioni", "quantity": 4 }]
      """

  @P2 @TC-API-12 @D-2
  Scenario Outline: TC-API-12 Server rejects the illegal transition <from> to <to>
    Given I have an order with status "<from>" created via the API
    When I send a PUT request to "/api/orders/{orderId}" with body '{"status":"<to>"}'
    Then the response status is a client error

    Examples:
      | from      | to         |
      | DELIVERED | RECEIVED   |
      | CANCELED  | DELIVERING |

  @P2 @TC-API-13 @D-3
  Scenario Outline: TC-API-13 Server rejects <case>
    When I send a POST request to "/api/orders" with body '<body>'
    Then the response status is 400

    Examples:
      | case                  | body                                                                     |
      | a pizza not on menu   | {"sender":"Ann","contents":[{"name":"Not On Menu","quantity":1}]}        |
      | a fractional quantity | {"sender":"Ann","contents":[{"name":"Margherita Pizza","quantity":1.5}]} |

  @P3 @TC-API-14
  Scenario: TC-API-14 CORS headers
    When I send a GET request to "/api/daily-menu"
    Then the response header "access-control-allow-origin" is "*"
    When I send a OPTIONS request to "/api/orders"
    Then the response status is 200
