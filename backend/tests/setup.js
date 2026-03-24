// load environment variables before any test runs
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
// set NODE_ENV to test so rate limiter and other env-gated logic behave correctly
process.env.NODE_ENV = 'test';
