// Cucumber profiles. Run with `npx cucumber-js --profile <name>`.
// Known defects (D-1…D-7) and behaviour still to confirm are tagged @known-defect / @to-confirm.
// They assert the CORRECT behaviour, so they fail until fixed and are excluded from the default run.

const common = {
    paths: ['tests/features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['tests/support/**/*.ts', 'tests/steps/**/*.ts'],
    format: ['progress-bar', 'summary', 'html:reports/cucumber-report.html', 'json:reports/cucumber-report.json'],
    formatOptions: { snippetInterface: 'async-await' },
};

const stable = 'not @known-defect and not @to-confirm';

module.exports = {
    default: { ...common, tags: stable },
    smoke: { ...common, tags: `@P1 and ${stable}` },
    api: { ...common, tags: `@api and ${stable}` },
    ui: { ...common, tags: `@ui and ${stable}` },
    defects: { ...common, tags: '@known-defect or @to-confirm' },
    all: { ...common },
    // Used by the VS Code Cucumber Test Runner (Testing panel). It passes the feature/scenario to run
    // and reads --format message from stdout, so no paths (they'd be merged) and no stdout formatters.
    // No tag filter: a scenario clicked in the panel always runs, @known-defect included.
    ide: { requireModule: common.requireModule, require: common.require, formatOptions: common.formatOptions },
};
