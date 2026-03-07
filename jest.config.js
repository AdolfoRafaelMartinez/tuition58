
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],
  setupFilesAfterEnv: ['./src/jest.setup.cjs']
};
