@api @auth-api
Feature: Authentication API

  @P1 @TC-API-AUTH-1
  Scenario: TC-API-AUTH-1 Valid login returns a token
    When I send a POST request to "/api/login" with body '{"username":"user","password":"pass"}'
    Then the response status is 200
    And the response field "success" is true
    And the response field "token" is present

  @P1 @TC-API-AUTH-2
  Scenario Outline: TC-API-AUTH-2 Login fails with <case>
    When I send a POST request to "/api/login" with body '<body>'
    Then the response status is 401
    And the response field "error" is "Invalid credentials"

    Examples:
      | case             | body                                    |
      | wrong password   | {"username":"user","password":"nope"}   |
      | unknown user     | {"username":"nobody","password":"pass"} |
      | missing password | {"username":"user"}                     |
      | empty body       | {}                                      |

  @P1 @TC-API-AUTH-3
  Scenario Outline: TC-API-AUTH-3 Protected endpoint rejects <case>
    When I send a GET request to "/api/protected" with the Authorization header '<header>'
    Then the response status is 401
    And the response field "message" is "Valid token required"

    Examples:
      | case             | header                       |
      | no header        | [none]                       |
      | no Bearer prefix | eyJyb2xlIjoiYWRtaW4ifQ==     |
      | a wrong token    | Bearer wrong-token           |

  @P1 @TC-API-AUTH-3
  Scenario: TC-API-AUTH-3 Protected endpoint accepts a valid token
    Given I have logged in via the API
    When I send a GET request to "/api/protected" with the Authorization header "Bearer {loginToken}"
    Then the response status is 200
    And the response "data.secretRecipes" has 3 entries
    And the response field "data.staffDiscount" is present
    And the response field "data.vipCode" is present
    And the response field "data.deliveryNote" is present

  @P2 @TC-API-AUTH-4
  Scenario Outline: TC-API-AUTH-4 Admin endpoint with <case>
    Given I have logged in via the API
    When I send a GET request to "/api/admin" with the Authorization header '<header>'
    Then the response status is <status>
    And the response field "message" is "<message>"

    Examples:
      | case             | header                           | status | message              |
      | no token         | [none]                           | 401    | Token required       |
      | non-JSON token   | Bearer not-json!!                | 401    | Invalid token format |
      | a user role      | Bearer {base64:{"role":"user"}}  | 403    | Not authorised       |
      | the login token  | Bearer {loginToken}              | 200    | Welcome, admin!      |

  @P1 @TC-API-AUTH-5 @D-1
  Scenario: TC-API-AUTH-5 Admin endpoint rejects a token the client forged
    When I send a GET request to "/api/admin" with the Authorization header 'Bearer {base64:{"role":"admin","forged":1}}'
    Then the response status is a client error
