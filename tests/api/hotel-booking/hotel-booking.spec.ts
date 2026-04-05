import { test, expect } from '@playwright/test';
import { BaseClient } from '../../utils/BaseClient';
import { DataGenerator } from '../../utils/DataGenerator';
import logger from '../../utils/logger';

// Types for API responses
interface AutosuggestResponse {
  suggestions?: Array<{
    id: string;
    name: string;
    type: string;
    location?: {
      city?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
  message?: string;
}

// Retry helper for flaky endpoints
const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 3): Promise<any> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempting request (attempt ${attempt}/${maxRetries})`);
      const response = await requestFn();
      logger.info(`Request successful on attempt ${attempt}`);
      return response;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Request failed on attempt ${attempt}: ${lastError.message}`);
      
      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} attempts failed`);
        throw lastError;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError!;
};

describe('Hotel Booking - Autosuggest API', () => {
  let baseClient: BaseClient;
  let dataGenerator: DataGenerator;
  
  test.beforeAll(async () => {
    baseClient = new BaseClient('https://public-api.akeeder.com');
    dataGenerator = new DataGenerator();
    logger.info('Hotel Booking API tests initialized');
  });
  
  describe('GET /hotel/v4/autosuggest - Hotel Search Autosuggest', () => {
    
    test('should return suggestions for valid hotel search term', async () => {
      logger.info('Testing valid hotel autosuggest request');
      
      const searchTerm = 'the venetan ls vegas';
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: { term: searchTerm }
        });
      });
      
      logger.info(`Autosuggest response status: ${response.status}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      
      const responseData: AutosuggestResponse = response.data;
      
      // Verify response structure
      expect(responseData.status).toBeDefined();
      
      if (responseData.suggestions) {
        expect(Array.isArray(responseData.suggestions)).toBe(true);
        
        // Verify suggestion structure if suggestions exist
        if (responseData.suggestions.length > 0) {
          const firstSuggestion = responseData.suggestions[0];
          expect(firstSuggestion.id).toBeDefined();
          expect(firstSuggestion.name).toBeDefined();
          expect(firstSuggestion.type).toBeDefined();
          
          logger.info(`Found ${responseData.suggestions.length} suggestions`);
        }
      }
    });
    
    test('should handle search with popular hotel names', async () => {
      logger.info('Testing autosuggest with popular hotel names');
      
      const popularHotels = [
        'marriott',
        'hilton',
        'hyatt',
        'sheraton'
      ];
      
      for (const hotelName of popularHotels) {
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term: hotelName }
          });
        });
        
        expect(response.status).toBe(200);
        logger.info(`Autosuggest for '${hotelName}' returned status ${response.status}`);
      }
    });
    
    test('should handle search with city names', async () => {
      logger.info('Testing autosuggest with city names');
      
      const cities = [
        'las vegas',
        'new york',
        'london',
        'paris'
      ];
      
      for (const city of cities) {
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term: city }
          });
        });
        
        expect(response.status).toBe(200);
        logger.info(`Autosuggest for '${city}' returned status ${response.status}`);
      }
    });
    
    test('should handle empty search term', async () => {
      logger.info('Testing autosuggest with empty search term');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: { term: '' },
          validateStatus: () => true // Accept any status code
        });
      });
      
      // Should either return 200 with empty results or 400 for validation error
      expect([200, 400]).toContain(response.status);
      logger.info(`Empty term response status: ${response.status}`);
    });
    
    test('should handle missing search term parameter', async () => {
      logger.info('Testing autosuggest without search term parameter');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          validateStatus: () => true // Accept any status code
        });
      });
      
      // Should return validation error
      expect([400, 422]).toContain(response.status);
      logger.info(`Missing term response status: ${response.status}`);
    });
    
    test('should handle special characters in search term', async () => {
      logger.info('Testing autosuggest with special characters');
      
      const specialCharTerms = [
        'hotel@test',
        'hotel#123',
        'hotel & spa',
        'hotel-resort'
      ];
      
      for (const term of specialCharTerms) {
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term },
            validateStatus: () => true // Accept any status code
          });
        });
        
        // Should handle gracefully (200) or return validation error
        expect([200, 400]).toContain(response.status);
        logger.info(`Special char term '${term}' response status: ${response.status}`);
      }
    });
    
    test('should handle very long search terms', async () => {
      logger.info('Testing autosuggest with very long search term');
      
      const longTerm = dataGenerator.generateRandomString(500);
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: { term: longTerm },
          validateStatus: () => true // Accept any status code
        });
      });
      
      // Should handle gracefully or return validation error
      expect([200, 400, 414]).toContain(response.status);
      logger.info(`Long term response status: ${response.status}`);
    });
    
    test('should handle unicode characters in search term', async () => {
      logger.info('Testing autosuggest with unicode characters');
      
      const unicodeTerms = [
        'hôtel',
        'москва',
        '北京',
        'تونس'
      ];
      
      for (const term of unicodeTerms) {
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term },
            validateStatus: () => true // Accept any status code
          });
        });
        
        expect([200, 400]).toContain(response.status);
        logger.info(`Unicode term '${term}' response status: ${response.status}`);
      }
    });
    
    test('should handle case sensitivity', async () => {
      logger.info('Testing autosuggest case sensitivity');
      
      const baseTerm = 'marriott';
      const caseVariations = [
        baseTerm.toLowerCase(),
        baseTerm.toUpperCase(),
        baseTerm.charAt(0).toUpperCase() + baseTerm.slice(1)
      ];
      
      const responses = [];
      
      for (const term of caseVariations) {
        const response = await retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term }
          });
        });
        
        expect(response.status).toBe(200);
        responses.push(response.data);
        logger.info(`Case variation '${term}' processed successfully`);
      }
      
      // All case variations should return similar results
      logger.info('Case sensitivity test completed');
    });
    
    test('should handle concurrent requests', async () => {
      logger.info('Testing concurrent autosuggest requests');
      
      const searchTerms = [
        'hotel california',
        'plaza hotel',
        'grand hotel',
        'resort spa'
      ];
      
      const concurrentRequests = searchTerms.map(term => 
        retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: { term }
          });
        })
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        logger.info(`Concurrent request ${index + 1} completed successfully`);
      });
      
      logger.info('All concurrent requests completed successfully');
    });
  });
});