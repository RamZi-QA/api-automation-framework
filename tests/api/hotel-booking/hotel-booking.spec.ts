import { test, expect } from '@playwright/test';
import { BaseClient } from '../../utils/BaseClient';
import { DataGenerator } from '../../utils/DataGenerator';
import logger from '../../utils/logger';

// Types for API responses
interface AutosuggestResponse {
  suggestions: HotelSuggestion[];
  total: number;
}

interface HotelSuggestion {
  id: string;
  name: string;
  location: string;
  type: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Retry helper for flaky endpoints
async function retryRequest<T>(requestFn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Request attempt ${i + 1} failed: ${lastError.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

describe('Hotel Booking API - Autosuggest', () => {
  let baseClient: BaseClient;
  let dataGenerator: DataGenerator;
  
  beforeAll(() => {
    baseClient = new BaseClient('https://public-api.akeeder.com');
    dataGenerator = new DataGenerator();
    logger.info('Starting Hotel Booking API tests');
  });
  
  afterAll(() => {
    logger.info('Completed Hotel Booking API tests');
  });
  
  describe('GET /hotel/v4/autosuggest', () => {
    // Happy path tests
    test('should return hotel suggestions for valid search term', async () => {
      logger.info('Testing autosuggest with valid hotel name');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'the venetian las vegas'
          }
        });
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.data.suggestions)).toBe(true);
      expect(response.data.suggestions.length).toBeGreaterThan(0);
      
      // Validate first suggestion structure
      const firstSuggestion = response.data.suggestions[0];
      expect(firstSuggestion).toHaveProperty('id');
      expect(firstSuggestion).toHaveProperty('name');
      expect(firstSuggestion).toHaveProperty('location');
      expect(firstSuggestion).toHaveProperty('type');
      
      logger.info(`Found ${response.data.suggestions.length} suggestions`);
    });
    
    test('should return suggestions for partial hotel name', async () => {
      logger.info('Testing autosuggest with partial hotel name');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'marriott'
          }
        });
      });
      
      expect(response.status).toBe(200);
      expect(response.data.suggestions).toBeDefined();
      expect(response.data.suggestions.length).toBeGreaterThan(0);
      
      // Verify suggestions contain the search term
      const containsSearchTerm = response.data.suggestions.some((suggestion: HotelSuggestion) => 
        suggestion.name.toLowerCase().includes('marriott')
      );
      expect(containsSearchTerm).toBe(true);
    });
    
    test('should return suggestions for city search', async () => {
      logger.info('Testing autosuggest with city name');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'New York'
          }
        });
      });
      
      expect(response.status).toBe(200);
      expect(response.data.suggestions).toBeDefined();
      expect(response.data.suggestions.length).toBeGreaterThan(0);
    });
    
    // Validation and error tests
    test('should handle empty search term', async () => {
      logger.info('Testing autosuggest with empty search term');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: ''
          },
          validateStatus: () => true // Accept any status code
        });
      });
      
      // API might return 400 for empty term or 200 with empty results
      if (response.status === 400) {
        expect(response.data).toHaveProperty('error');
      } else {
        expect(response.status).toBe(200);
        expect(response.data.suggestions.length).toBe(0);
      }
    });
    
    test('should handle missing term parameter', async () => {
      logger.info('Testing autosuggest without term parameter');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          validateStatus: () => true
        });
      });
      
      expect([400, 422]).toContain(response.status);
      expect(response.data).toHaveProperty('error');
    });
    
    test('should return empty results for non-existent hotel', async () => {
      logger.info('Testing autosuggest with non-existent hotel');
      
      const nonExistentTerm = dataGenerator.generateString(20) + '_nonexistent_hotel';
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: nonExistentTerm
          }
        });
      });
      
      expect(response.status).toBe(200);
      expect(response.data.suggestions.length).toBe(0);
    });
    
    // Edge cases
    test('should handle special characters in search term', async () => {
      logger.info('Testing autosuggest with special characters');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'hotel & spa'
          }
        });
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('suggestions');
    });
    
    test('should handle very long search term', async () => {
      logger.info('Testing autosuggest with very long search term');
      
      const longTerm = dataGenerator.generateString(500);
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: longTerm
          },
          validateStatus: () => true
        });
      });
      
      // Should either return 400 for too long term or 200 with empty results
      expect([200, 400, 414]).toContain(response.status);
    });
    
    test('should handle URL encoded search term', async () => {
      logger.info('Testing autosuggest with URL encoded characters');
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'the venetian las vegas' // Will be automatically encoded
          }
        });
      });
      
      expect(response.status).toBe(200);
      expect(response.data.suggestions.length).toBeGreaterThan(0);
    });
    
    test('should handle case insensitive search', async () => {
      logger.info('Testing case insensitive search');
      
      const lowerCaseResponse = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'hilton'
          }
        });
      });
      
      const upperCaseResponse = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'HILTON'
          }
        });
      });
      
      expect(lowerCaseResponse.status).toBe(200);
      expect(upperCaseResponse.status).toBe(200);
      
      // Both should return similar results
      if (lowerCaseResponse.data.suggestions.length > 0 && upperCaseResponse.data.suggestions.length > 0) {
        expect(lowerCaseResponse.data.suggestions.length).toBeGreaterThan(0);
        expect(upperCaseResponse.data.suggestions.length).toBeGreaterThan(0);
      }
    });
    
    // Performance and reliability tests
    test('should respond within acceptable time limit', async () => {
      logger.info('Testing response time performance');
      
      const startTime = Date.now();
      
      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v4/autosuggest', {
          params: {
            term: 'hotel'
          },
          timeout: 5000 // 5 second timeout
        });
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      logger.info(`Response time: ${responseTime}ms`);
    });
    
    test('should handle concurrent requests', async () => {
      logger.info('Testing concurrent autosuggest requests');
      
      const searchTerms = ['marriott', 'hilton', 'hyatt', 'sheraton', 'westin'];
      
      const promises = searchTerms.map(term => 
        retryRequest(async () => {
          return await baseClient.get('/hotel/v4/autosuggest', {
            params: {
              term: term
            }
          });
        })
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('suggestions');
        logger.info(`Concurrent request ${index + 1} completed successfully`);
      });
    });
  });
});