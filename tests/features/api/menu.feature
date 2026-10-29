@api @menu-api
Feature: Daily menu API

  @P1 @TC-API-1
  Scenario: TC-API-1 Get the daily menu
    When I send a GET request to "/api/daily-menu"
    Then the response status is 200
    And the response field "success" is true
    And the response field "message" is "Daily menu retrieved successfully"
    And the response "data" has 5 entries
    And every entry in "data" has a non-empty "name", "description" and "imageUrl"
