/**
 * Reset environment variables for all tests to help ensure no pollution between tests,
 * as well as to ensure that no real credentials are accidentally used in tests.
 */
export function resetEnv() {
  const prefixesToReset = ['APPORTIONMENTS_', 'SENTRY_', 'MAILGUN_', 'AUTH_', 'VITE_'];
  for (const key in process.env) {
    if (prefixesToReset.some((prefix) => key.startsWith(prefix))) {
      delete process.env[key];
    }
  }

  // Manually reset any specific variables if needed
  // const valuesToReset = [];
  // for (const key of valuesToReset) {
  //   delete process.env[key];
  // }

  // Manually set NODE_ENV to 'test' for all tests
  process.env.NODE_ENV = 'test';
}
