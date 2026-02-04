import { APIResponse } from '@playwright/test';
import { logger } from './logger';

export class Validators {
  /**
   * Validate HTTP status code
   */
  static async validateStatusCode(response: APIResponse, expectedStatus: number) {
    const actualStatus = response.status();
    if (actualStatus !== expectedStatus) {
      const responseBody = await response.text();
      logger.error(
        `Status code mismatch. Expected: ${expectedStatus}, Got: ${actualStatus}, Body: ${responseBody}`
      );
      throw new Error(
        `Expected status ${expectedStatus}, got ${actualStatus}. Response: ${responseBody}`
      );
    }
    logger.info(`Status code validated: ${actualStatus}`);
  }

  /**
   * Validate response contains required fields
   */
  static async validateSchema(data: any, requiredFields: string[]) {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(field in data)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      logger.error(`Missing required fields: ${missingFields.join(', ')}`);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    logger.info(`Schema validated with fields: ${requiredFields.join(', ')}`);
  }

  /**
   * Validate response time is within acceptable limit
   */
  static validateResponseTime(duration: number, maxTime: number) {
    if (duration > maxTime) {
      logger.warn(`Response time ${duration}ms exceeded max ${maxTime}ms`);
      throw new Error(`Response time ${duration}ms exceeded maximum ${maxTime}ms`);
    }
    logger.info(`Response time validated: ${duration}ms (max: ${maxTime}ms)`);
  }

  /**
   * Validate that response body is valid JSON
   */
  static async validateJsonResponse(response: APIResponse) {
    try {
      await response.json();
      logger.info('Response is valid JSON');
    } catch (error) {
      const body = await response.text();
      logger.error(`Invalid JSON response: ${body}`);
      throw new Error(`Response is not valid JSON: ${body}`);
    }
  }

  /**
   * Validate array response has expected length
   */
  static validateArrayLength(
    array: any[],
    expectedLength?: number,
    minLength?: number,
    maxLength?: number
  ) {
    if (expectedLength !== undefined && array.length !== expectedLength) {
      throw new Error(`Expected array length ${expectedLength}, got ${array.length}`);
    }

    if (minLength !== undefined && array.length < minLength) {
      throw new Error(`Array length ${array.length} is less than minimum ${minLength}`);
    }

    if (maxLength !== undefined && array.length > maxLength) {
      throw new Error(`Array length ${array.length} exceeds maximum ${maxLength}`);
    }

    logger.info(`Array length validated: ${array.length}`);
  }

  /**
   * Validate field value matches expected type
   */
  static validateFieldType(data: any, field: string, expectedType: string) {
    const actualType = typeof data[field];
    if (actualType !== expectedType) {
      throw new Error(
        `Field '${field}' has type '${actualType}', expected '${expectedType}'`
      );
    }
    logger.info(`Field '${field}' type validated: ${expectedType}`);
  }

  /**
   * Validate field value matches pattern (regex)
   */
  static validateFieldPattern(data: any, field: string, pattern: RegExp) {
    const value = data[field];
    if (!pattern.test(value)) {
      throw new Error(`Field '${field}' value '${value}' does not match pattern ${pattern}`);
    }
    logger.info(`Field '${field}' pattern validated`);
  }
}
