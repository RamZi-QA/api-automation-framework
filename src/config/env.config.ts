import * as dotenv from 'dotenv';

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

const BASE_URLS = {
  dev: process.env.API_BASE_URL_DEV || 'https://dev-api.akeedcorp.com',
  qa: process.env.API_BASE_URL_QA || 'https://qa-api.akeedcorp.com',
  staging: process.env.API_BASE_URL_STAGING || 'https://staging-api.akeedcorp.com',
};

export const ENV = {
  environment: ENVIRONMENT,
  apiBaseUrl: BASE_URLS[ENVIRONMENT as keyof typeof BASE_URLS],
  apiKey: process.env.API_KEY || '',
  apiSecret: process.env.API_SECRET || '',
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  retryCount: parseInt(process.env.RETRY_COUNT || '2'),
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default ENV;
