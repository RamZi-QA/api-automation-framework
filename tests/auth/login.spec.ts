import { test, expect } from '@playwright/test';
import { AuthClient } from '../../src/clients/authClient';
import { DataGenerator } from '../../src/helpers/dataGenerator';
import { Validators } from '../../src/helpers/validators';

test.describe('Authentication API - Login', () => {
  let authClient: AuthClient;

  test.beforeAll(async () => {
    authClient = new AuthClient();
    await authClient.init();
  });

  test.afterAll(async () => {
    await authClient.dispose();
  });

  test('should login successfully with valid credentials', async () => {
    // Arrange
    const credentials = {
      email: 'user@akeedcorp.com',
      password: 'ValidPassword123!',
    };

    // Act
    const response = await authClient.login(credentials.email, credentials.password);

    // Assert
    await Validators.validateStatusCode(response, 200);
    await Validators.validateJsonResponse(response);

    const responseBody = await response.json();
    await Validators.validateSchema(responseBody, ['token', 'refreshToken', 'user']);

    expect(responseBody.user).toHaveProperty('email', credentials.email);
    expect(responseBody.token).toBeTruthy();
  });

  test('should return 401 for invalid credentials', async () => {
    // Arrange
    const credentials = {
      email: 'user@akeedcorp.com',
      password: 'WrongPassword123!',
    };

    // Act
    const response = await authClient.login(credentials.email, credentials.password);

    // Assert
    await Validators.validateStatusCode(response, 401);

    const responseBody = await response.json();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.message).toContain('Invalid credentials');
  });

  test('should return 400 for missing email', async () => {
    // Arrange
    const credentials = {
      email: '',
      password: 'ValidPassword123!',
    };

    // Act
    const response = await authClient.login(credentials.email, credentials.password);

    // Assert
    await Validators.validateStatusCode(response, 400);

    const responseBody = await response.json();
    expect(responseBody.error).toBeDefined();
  });

  test('should return 400 for missing password', async () => {
    // Arrange
    const credentials = {
      email: 'user@akeedcorp.com',
      password: '',
    };

    // Act
    const response = await authClient.login(credentials.email, credentials.password);

    // Assert
    await Validators.validateStatusCode(response, 400);

    const responseBody = await response.json();
    expect(responseBody.error).toBeDefined();
  });

  test('should have response time under 2 seconds', async () => {
    // Arrange
    const credentials = {
      email: 'user@akeedcorp.com',
      password: 'ValidPassword123!',
    };

    // Act
    const startTime = Date.now();
    const response = await authClient.login(credentials.email, credentials.password);
    const duration = Date.now() - startTime;

    // Assert
    Validators.validateResponseTime(duration, 2000);
    expect(response.status()).toBe(200);
  });
});
