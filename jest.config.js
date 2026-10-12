const { components, logic } = require("./jest.projects.js");

/** @type {import('jest').Config} */
module.exports = {
  maxWorkers: 3,
  workerIdleMemoryLimit: "512MB",
  projects: [logic, components],
};
