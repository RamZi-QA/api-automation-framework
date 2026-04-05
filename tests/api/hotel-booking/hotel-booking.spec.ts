import { test, expect } from '@playwright/test';
import { BaseClient } from '../../utils/BaseClient';
import { DataGenerator } from '../../utils/DataGenerator';
import logger from '../../utils/logger';

/**
 * Hotel Booking API Test Suite
 * Tests the hotel autosuggest functionality
 */
describe('Hotel Booking API', () => {
  let baseClient: BaseClient;
  let dataGenerator: DataGenerator;

  /**
   * Test setup - initialize clients before each test
   */
  beforeEach(async () => {
    baseClient = new BaseClient('https://public-api.akeeder.com');
    dataGenerator = new DataGenerator();
    logger.info('Initialized test clients for Hotel Booking tests');
  });

  /**
   * Retry helper function for handling flaky API responses
   */
  const retryRequest = async (requestFn: () => Promise<any>, maxRetries: number = 3): Promise<any> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempt ${attempt} of ${maxRetries}`);
        const response = await requestFn();
        return response;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
        
        if (attempt === maxRetries) {
          logger.error(`All ${maxRetries} attempts failed`);
          throw lastError;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  /**
   * Hotel Autosuggest Endpoint Tests
   * Testing GET /hotel/v4/autosuggest functionality
   */
  describe('GET /hotel/v4/autosuggest', () => {
    
    /**
     * Happy Path Test - Valid hotel search term
     */
    test('should return hotel suggestions for valid search term', async () => {
      logger.info('Testing hotel autosuggest with valid term');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'the venetian las vegas'
          }
        });
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      
      if (response.data.length > 0) {
        const firstResult = response.data[0];
        expect(firstResult).toHaveProperty('name');
        expect(typeof firstResult.name).toBe('string');
        logger.info(`Found ${response.data.length} hotel suggestions`);
      }
    });

    /**
     * Happy Path Test - Different valid search terms
     */
    test('should return suggestions for various hotel names', async () => {
      const searchTerms = [
        'marriott',
        'hilton',
        'hyatt',
        'sheraton'
      ];

      for (const term of searchTerms) {
        logger.info(`Testing autosuggest with term: ${term}`);
        
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term }
          });
        });

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        logger.info(`Term '${term}' returned ${response.data?.length || 0} results`);
      }
    });

    /**
     * Edge Case Test - Empty search term
     */
    test('should handle empty search term appropriately', async () => {
      logger.info('Testing autosuggest with empty term');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: ''
          },
          validateStatus: (status) => status < 500 // Accept 4xx errors
        });
      });

      // API should either return 400 Bad Request or empty results
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.data)).toBeTruthy();
      }
      
      logger.info(`Empty term response status: ${response.status}`);
    });

    /**
     * Edge Case Test - Very long search term
     */
    test('should handle very long search terms', async () => {
      const longTerm = dataGenerator.generateRandomString(500);
      logger.info('Testing autosuggest with very long term');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: longTerm
          },
          validateStatus: (status) => status < 500
        });
      });

      // Should handle gracefully without server error
      expect(response.status).toBeLessThan(500);
      logger.info(`Long term response status: ${response.status}`);
    });

    /**
     * Edge Case Test - Special characters in search term
     */
    test('should handle special characters in search term', async () => {
      const specialTerms = [
        'hotel@#$%',
        'café & restaurant',
        'hôtel-paris',
        '酒店'
      ];

      for (const term of specialTerms) {
        logger.info(`Testing autosuggest with special characters: ${term}`);
        
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term },
            validateStatus: (status) => status < 500
          });
        });

        expect(response.status).toBeLessThan(500);
        logger.info(`Special term '${term}' response status: ${response.status}`);
      }
    });

    /**
     * Validation Test - Missing required parameter
     */
    test('should return error when term parameter is missing', async () => {
      logger.info('Testing autosuggest without term parameter');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          validateStatus: (status) => status < 500
        });
      });

      // Should return 400 Bad Request for missing required parameter
      expect([400, 422]).toContain(response.status);
      logger.info(`Missing parameter response status: ${response.status}`);
    });

    /**
     * Performance Test - Response time validation
     */
    test('should respond within acceptable time limits', async () => {
      logger.info('Testing autosuggest response time');
      
      const startTime = Date.now();
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'marriott'
          }
        });
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      logger.info(`Response time: ${responseTime}ms`);
    });

    /**
     * Data Validation Test - Response structure
     */
    test('should return properly structured response data', async () => {
      logger.info('Testing autosuggest response structure');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'hotel'
          }
        });
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      
      if (response.data && response.data.length > 0) {
        const suggestion = response.data[0];
        
        // Validate common properties that autosuggest APIs typically return
        expect(typeof suggestion).toBe('object');
        
        // Log the structure for debugging
        logger.info(`Sample suggestion structure: ${JSON.stringify(suggestion, null, 2)}`);
      }
    });

    /**
     * Rate Limiting Test - Multiple rapid requests
     */
    test('should handle multiple rapid requests appropriately', async () => {
      logger.info('Testing rate limiting with multiple rapid requests');
      
      const requests = Array(5).fill(null).map((_, index) => 
        baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: `hotel${index}`
          },
          validateStatus: (status) => status < 500
        })
      );

      const responses = await Promise.allSettled(requests);
      
      // At least some requests should succeed
      const successfulResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successfulResponses.length).toBeGreaterThan(0);
      logger.info(`${successfulResponses.length} out of ${requests.length} requests succeeded`);
    });
  });
});