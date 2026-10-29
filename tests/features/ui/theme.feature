@ui @theme
Feature: Light and dark theme
  As a user
  I want to switch between light and dark themes
  So that the site is comfortable to read

  @P2 @TC-THEME-1
  Scenario: TC-THEME-1 Toggle the theme on the home page
    Given I open the home page
    When I toggle the theme
    Then the page is in dark mode
    And the theme toggle shows "☀️"
    And the saved theme is "dark"
    When I toggle the theme
    Then the page is in light mode
    And the theme toggle shows "🌙"
    And the saved theme is "light"

  @P2 @TC-THEME-2
  Scenario: TC-THEME-2 Dark theme persists across reload
    Given I open the home page
    And I toggle the theme
    When I reload the page
    Then the page is in dark mode
    And the theme toggle shows "☀️"

  @P3 @TC-THEME-3
  Scenario: TC-THEME-3 Theme is shared across pages
    Given I open the home page
    And I toggle the theme
    When I open the login page
    Then the page is in dark mode
    When I open the protected page
    Then the page is in dark mode

  @P3 @TC-THEME-4
  Scenario: TC-THEME-4 Toggle the theme on the login page
    Given I open the login page
    When I toggle the theme
    Then the page is in dark mode
    And the saved theme is "dark"
    When I toggle the theme
    Then the page is in light mode
    And the saved theme is "light"

  @P3 @TC-THEME-4
  Scenario: TC-THEME-4 Toggle the theme on the protected page when logged in
    Given I am logged in
    And I open the protected page
    When I toggle the theme
    Then the page is in dark mode
    And the saved theme is "dark"
    When I toggle the theme
    Then the page is in light mode
    And the saved theme is "light"

  @P3 @TC-THEME-5 @D-5
  Scenario: TC-THEME-5 Toggle the theme on the protected page when logged out
    Given I open the protected page
    When I toggle the theme
    Then the page is in dark mode
    And the saved theme is "dark"

  @P3 @TC-THEME-6 @visual @chromium-only
  Scenario Outline: TC-THEME-6 Home page in <theme> mode matches the visual baseline
    Given I open the home page
    And the page is switched to <theme> mode
    Then the home page matches the screenshot "home-<theme>.png"

    Examples:
      | theme |
      | light |
      | dark  |
