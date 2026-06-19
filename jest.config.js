/**
 * Jest config for pure-logic unit tests (no React Native runtime).
 *
 * The extracted modules under src/lib (progressMath, achievementRules) and the
 * static data they depend on are plain TypeScript, so they run under ts-jest in
 * a Node environment without the heavyweight jest-expo / RN preset.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
};
