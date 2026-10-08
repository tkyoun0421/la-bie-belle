const { components, logic } = require("./jest.projects.js");

/** @type {import('jest').Config} */
module.exports = { projects: [logic, components] };
