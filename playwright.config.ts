import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

const BASE_URLS = {
  dev: process.env.API_BASE_URL_DEV || 'https://dev-api.akeedcorp.com',
  qa: process.env.API_BASE_URL_QA || 'https://qa-api.akeedcorp.com',
  staging: process.env.API_BASE_URL_STAGING || 'https://staging-api.akeedcorp.com',
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URLS[ENVIRONMENT as keyof typeof BASE_URLS],
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'API Tests',
      testMatch: '**/*.spec.ts',
    },
  ],
});
