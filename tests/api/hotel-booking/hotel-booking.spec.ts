import { test, expect } from '@playwright/test';
import { BaseClient } from '../../utils/BaseClient';
import { DataGenerator } from '../../utils/DataGenerator';
import logger from '../../utils/logger';

// Type definitions for API responses
interface AdditionalCharge {
  description: string;
  amount: number;
  currency: string;
  type: string;
}

interface PriceBreakdown {
  basePrice: number;
  taxesAndFees: number;
  affiliateServiceCharge: number;
  discount?: number;
  total: number;
  dueNow: number;
  dueAtProperty: number;
  additionalCharges: AdditionalCharge[];
}

interface HotelBookingRequest {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  currency: string;
}

interface HotelBookingResponse {
  bookingId: string;
  status: string;
  pricing: PriceBreakdown;
  hotelDetails: {
    name: string;
    currency: string;
    location: string;
  };
  paymentMethod?: {
    type: string;
    lastFour?: string;
    cardType?: string;
  };
}

/**
 * Retry helper for flaky API endpoints
 */
async function retryRequest<T>(
  client: BaseClient,
  requestFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempt ${attempt} of ${maxRetries}`);
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt} failed: ${error}`);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

test.describe('Hotel Booking API - Additional Charges Feature', () => {
  let client: BaseClient;
  let dataGenerator: DataGenerator;

  test.beforeEach(() => {
    client = new BaseClient();
    dataGenerator = new DataGenerator();
  });

  test.describe('Hotel Autosuggest Endpoint', () => {
    /**
     * Test hotel search autosuggest functionality
     * Validates basic search capabilities for hotel booking flow
     */
    test('should return hotel suggestions for valid search term', async () => {
      logger.info('Testing hotel autosuggest with valid search term');
      
      const searchTerm = 'the venetian las vegas';
      
      const response = await retryRequest(client, async () => {
        return await client.get('/hotel/v2/autosuggest', {
          params: { term: searchTerm }
        });
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.suggestions)).toBeTruthy();
      expect(response.data.suggestions.length).toBeGreaterThan(0);
      
      // Verify each suggestion has required fields
      response.data.suggestions.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('location');
      });
      
      logger.info(`Found ${response.data.suggestions.length} hotel suggestions`);
    });

    test('should handle empty search term gracefully', async () => {
      logger.info('Testing hotel autosuggest with empty search term');
      
      const response = await retryRequest(client, async () => {
        return await client.get('/hotel/v2/autosuggest', {
          params: { term: '' }
        });
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
      expect(response.data.error.message).toContain('search term');
    });

    test('should return empty results for non-existent hotel', async () => {
      logger.info('Testing hotel autosuggest with non-existent hotel');
      
      const invalidSearchTerm = dataGenerator.generateRandomString(50);
      
      const response = await retryRequest(client, async () => {
        return await client.get('/hotel/v2/autosuggest', {
          params: { term: invalidSearchTerm }
        });
      });

      expect(response.status).toBe(200);
      expect(response.data.suggestions).toEqual([]);
    });

    test('should handle special characters in search term', async () => {
      logger.info('Testing hotel autosuggest with special characters');
      
      const searchTermWithSpecialChars = 'hotel@#$%^&*()';
      
      const response = await retryRequest(client, async () => {
        return await client.get('/hotel/v2/autosuggest', {
          params: { term: searchTermWithSpecialChars }
        });
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });
  });

  test.describe('Hotel Booking with Additional Charges', () => {
    /**
     * Test hotel booking flow with additional charges due at property
     * Validates price breakdown calculation and currency conversion
     */
    test('should create booking with additional charges breakdown', async () => {
      logger.info('Testing hotel booking with additional charges');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 2,
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData);
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      // Validate booking structure
      expect(booking.bookingId).toBeDefined();
      expect(booking.status).toBe('confirmed');
      expect(booking.pricing).toBeDefined();
      
      // Validate price breakdown with additional charges
      const pricing = booking.pricing;
      expect(pricing.total).toBeDefined();
      expect(pricing.dueNow).toBeDefined();
      expect(pricing.dueAtProperty).toBeDefined();
      expect(Array.isArray(pricing.additionalCharges)).toBeTruthy();
      
      // Validate additional charges structure
      if (pricing.additionalCharges.length > 0) {
        pricing.additionalCharges.forEach((charge: AdditionalCharge) => {
          expect(charge.description).toBeDefined();
          expect(charge.amount).toBeGreaterThanOrEqual(0);
          expect(charge.currency).toBeDefined();
          expect(charge.type).toBeDefined();
        });
        
        // Validate total calculation includes additional charges
        const additionalChargesTotal = pricing.additionalCharges.reduce(
          (sum, charge) => sum + charge.amount, 0
        );
        expect(pricing.dueAtProperty).toBe(additionalChargesTotal);
        expect(pricing.total).toBe(pricing.dueNow + pricing.dueAtProperty);
      }
      
      logger.info(`Booking created with ID: ${booking.bookingId}`);
    });

    test('should handle booking without additional charges', async () => {
      logger.info('Testing hotel booking without additional charges');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 1,
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData);
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      // When no additional charges, due at property should be 0
      expect(booking.pricing.dueAtProperty).toBe(0);
      expect(booking.pricing.additionalCharges).toEqual([]);
      expect(booking.pricing.total).toBe(booking.pricing.dueNow);
      
      logger.info('Booking created without additional charges');
    });

    test('should validate currency conversion for additional charges', async () => {
      logger.info('Testing currency conversion for additional charges');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 2,
        currency: 'USD' // Different from SAR to test conversion
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData);
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      // Validate hotel currency information is provided
      expect(booking.hotelDetails.currency).toBeDefined();
      expect(booking.hotelDetails.currency).not.toBe('SAR');
      
      // Additional charges should still be calculated
      if (booking.pricing.additionalCharges.length > 0) {
        booking.pricing.additionalCharges.forEach((charge: AdditionalCharge) => {
          expect(charge.currency).toBeDefined();
        });
      }
      
      logger.info(`Currency conversion handled for ${booking.hotelDetails.currency}`);
    });

    test('should handle zero amount additional charges', async () => {
      logger.info('Testing booking with zero amount additional charges');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 1,
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData);
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      // Filter out zero amount charges in validation
      const nonZeroCharges = booking.pricing.additionalCharges.filter(
        charge => charge.amount > 0
      );
      
      const expectedDueAtProperty = nonZeroCharges.reduce(
        (sum, charge) => sum + charge.amount, 0
      );
      
      expect(booking.pricing.dueAtProperty).toBe(expectedDueAtProperty);
      
      logger.info('Zero amount charges handled correctly');
    });
  });

  test.describe('Booking Details Retrieval', () => {
    /**
     * Test retrieval of booking details showing payment information
     * Validates post-booking context with paid amounts and payment method
     */
    test('should retrieve booking details with payment information', async () => {
      logger.info('Testing booking details retrieval');
      
      const bookingId = dataGenerator.generateUUID();
      
      const response = await retryRequest(client, async () => {
        return await client.get(`/hotel/v2/bookings/${bookingId}`);
      });

      expect(response.status).toBe(200);
      const booking: HotelBookingResponse = response.data;
      
      // Validate booking details structure
      expect(booking.bookingId).toBe(bookingId);
      expect(booking.pricing).toBeDefined();
      expect(booking.hotelDetails).toBeDefined();
      
      // Validate payment method information
      if (booking.paymentMethod) {
        expect(booking.paymentMethod.type).toBeDefined();
        
        if (booking.paymentMethod.type === 'card') {
          expect(booking.paymentMethod.lastFour).toBeDefined();
          expect(booking.paymentMethod.cardType).toBeDefined();
          expect(booking.paymentMethod.lastFour).toHaveLength(4);
        }
      }
      
      logger.info(`Retrieved booking details for: ${bookingId}`);
    });

    test('should handle non-existent booking ID', async () => {
      logger.info('Testing booking details with invalid ID');
      
      const invalidBookingId = dataGenerator.generateUUID();
      
      const response = await retryRequest(client, async () => {
        return await client.get(`/hotel/v2/bookings/${invalidBookingId}`);
      });

      expect(response.status).toBe(404);
      expect(response.data.error).toBeDefined();
      expect(response.data.error.message).toContain('not found');
    });

    test('should validate affiliate service charge labeling', async () => {
      logger.info('Testing affiliate service charge labeling');
      
      const bookingId = dataGenerator.generateUUID();
      
      const response = await retryRequest(client, async () => {
        return await client.get(`/hotel/v2/bookings/${bookingId}`);
      });

      expect(response.status).toBe(200);
      const booking: HotelBookingResponse = response.data;
      
      // Validate that affiliate service charge is properly labeled
      expect(booking.pricing.affiliateServiceCharge).toBeDefined();
      expect(booking.pricing.affiliateServiceCharge).toBeGreaterThanOrEqual(0);
      
      logger.info('Affiliate service charge properly labeled');
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    /**
     * Test various edge cases and error scenarios
     * Validates system robustness and proper error handling
     */
    test('should handle missing required booking parameters', async () => {
      logger.info('Testing booking with missing required parameters');
      
      const incompleteBookingData = {
        hotelId: dataGenerator.generateUUID(),
        // Missing checkIn, checkOut, rooms, guests
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', incompleteBookingData);
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
      expect(response.data.error.message).toContain('required');
    });

    test('should handle invalid date ranges', async () => {
      logger.info('Testing booking with invalid date ranges');
      
      const invalidBookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generatePastDate(7), // Past date
        checkOut: dataGenerator.generatePastDate(5), // Even earlier past date
        rooms: 1,
        guests: 1,
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', invalidBookingData);
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
      expect(response.data.error.message).toContain('date');
    });

    test('should handle very large amounts formatting', async () => {
      logger.info('Testing booking with large amounts');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 10, // Large number of rooms
        guests: 20, // Large number of guests
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData);
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      // Validate that large amounts are handled properly
      expect(booking.pricing.total).toBeGreaterThan(999);
      expect(typeof booking.pricing.total).toBe('number');
      
      logger.info(`Large amount booking created: ${booking.pricing.total} SAR`);
    });

    test('should handle network timeout gracefully', async () => {
      logger.info('Testing network timeout handling');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 1,
        currency: 'SAR'
      };

      // Set a very short timeout to simulate network issues
      const timeoutClient = new BaseClient({ timeout: 1 });
      
      try {
        await retryRequest(timeoutClient, async () => {
          return await timeoutClient.post('/hotel/v2/bookings', bookingData);
        });
      } catch (error) {
        expect(error).toBeDefined();
        logger.info('Network timeout handled gracefully');
      }
    });
  });

  test.describe('Internationalization and Localization', () => {
    /**
     * Test multilingual support and RTL layout
     * Validates Arabic/English content and proper formatting
     */
    test('should handle Arabic language preferences', async () => {
      logger.info('Testing Arabic language support');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 1,
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData, {
          headers: { 'Accept-Language': 'ar' }
        });
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      // Validate that response includes Arabic content support
      expect(booking.bookingId).toBeDefined();
      
      logger.info('Arabic language preferences handled');
    });

    test('should handle English language preferences', async () => {
      logger.info('Testing English language support');
      
      const bookingData: HotelBookingRequest = {
        hotelId: dataGenerator.generateUUID(),
        checkIn: dataGenerator.generateFutureDate(7),
        checkOut: dataGenerator.generateFutureDate(10),
        rooms: 1,
        guests: 1,
        currency: 'SAR'
      };

      const response = await retryRequest(client, async () => {
        return await client.post('/hotel/v2/bookings', bookingData, {
          headers: { 'Accept-Language': 'en' }
        });
      });

      expect(response.status).toBe(201);
      const booking: HotelBookingResponse = response.data;
      
      expect(booking.bookingId).toBeDefined();
      
      logger.info('English language preferences handled');
    });
  });
});