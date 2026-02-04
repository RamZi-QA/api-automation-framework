import { test, expect } from '@playwright/test';
import { BaseClient } from '../../src/clients/baseClient';
import { ENV } from '../../src/config/env.config';
import { Validators } from '../../src/helpers/validators';

test.describe('Smoke Tests - Health Check', () => {
  let apiClient: BaseClient;

  test.beforeAll(async () => {
    apiClient = new BaseClient(ENV.apiBaseUrl);
    await apiClient.init();
  });

  test.afterAll(async () => {
    await apiClient.dispose();
  });

  test('API health check should return 200', async () => {
    // Act
    const response = await apiClient.get('/health');

    // Assert
    await Validators.validateStatusCode(response, 200);
    await Validators.validateJsonResponse(response);

    const health = await response.json();
    expect(health.status).toBe('healthy');
  });

  test('API should respond within acceptable time', async () => {
    // Act
    const startTime = Date.now();
    const response = await apiClient.get('/health');
    const duration = Date.now() - startTime;

    // Assert
    Validators.validateResponseTime(duration, 1000);
    expect(response.ok()).toBeTruthy();
  });

  test('API version endpoint should be accessible', async () => {
    // Act
    const response = await apiClient.get('/version');

    // Assert
    await Validators.validateStatusCode(response, 200);

    const version = await response.json();
    await Validators.validateSchema(version, ['version', 'environment']);
    expect(version.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
  });
});
