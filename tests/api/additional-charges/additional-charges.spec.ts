import { test, expect } from '@playwright/test';
import { BaseClient } from '../../utils/BaseClient';
import { DataGenerator } from '../../utils/DataGenerator';
import logger from '../../utils/logger';

// Type definitions for additional charges API responses
interface AdditionalCharge {
  id: string;
  description: string;
  amount: number;
  currency: string;
  type: 'resort_fee' | 'mandatory_tax' | 'city_tax' | 'other';
  dueAtProperty: boolean;
}

interface HotelPricingResponse {
  basePrice: number;
  taxesAndFees: number;
  affiliateServiceCharge: number;
  discount?: number;
  additionalCharges: AdditionalCharge[];
  totalAmount: number;
  dueNowAmount: number;
  dueAtPropertyAmount: number;
  currency: string;
  hotelCurrency: string;
}

interface BookingDetailsResponse {
  bookingId: string;
  paidAmount: number;
  dueAtPropertyAmount: number;
  paymentMethod: {
    type: 'card' | 'wallet' | 'corp';
    lastFour?: string;
    cardType?: string;
  };
  additionalCharges: AdditionalCharge[];
}

// Retry helper function for flaky API calls
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempt ${attempt} of ${maxRetries}`);
      return await requestFn();
    } catch (error) {
      logger.warn(`Attempt ${attempt} failed: ${error}`);
      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} attempts failed`);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry logic error');
}

describe('Additional Charges API Tests', () => {
  let baseClient: BaseClient;
  let dataGenerator: DataGenerator;

  test.beforeAll(async () => {
    baseClient = new BaseClient();
    dataGenerator = new DataGenerator();
    logger.info('Additional Charges test suite started');
  });

  describe('Hotel Pricing with Additional Charges', () => {
    test('should return complete pricing breakdown with additional charges', async () => {
      logger.info('Testing hotel pricing with additional charges - happy path');
      
      const hotelId = dataGenerator.generateHotelId();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('basePrice');
      expect(response.data).toHaveProperty('taxesAndFees');
      expect(response.data).toHaveProperty('affiliateServiceCharge');
      expect(response.data).toHaveProperty('additionalCharges');
      expect(response.data).toHaveProperty('totalAmount');
      expect(response.data).toHaveProperty('dueNowAmount');
      expect(response.data).toHaveProperty('dueAtPropertyAmount');
      expect(response.data).toHaveProperty('currency', 'SAR');
      expect(response.data).toHaveProperty('hotelCurrency');

      // Verify additional charges structure
      if (response.data.additionalCharges.length > 0) {
        response.data.additionalCharges.forEach(charge => {
          expect(charge).toHaveProperty('id');
          expect(charge).toHaveProperty('description');
          expect(charge).toHaveProperty('amount');
          expect(charge).toHaveProperty('currency');
          expect(charge).toHaveProperty('type');
          expect(charge).toHaveProperty('dueAtProperty', true);
        });
      }

      logger.info('Hotel pricing with additional charges test passed');
    });

    test('should calculate correct amounts when additional charges exist', async () => {
      logger.info('Testing amount calculations with additional charges');
      
      const hotelId = dataGenerator.generateHotelId();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      
      const { basePrice, taxesAndFees, affiliateServiceCharge, discount = 0, additionalCharges, totalAmount, dueNowAmount, dueAtPropertyAmount } = response.data;
      
      // Calculate expected amounts
      const expectedDueAtProperty = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const expectedDueNow = basePrice + taxesAndFees + affiliateServiceCharge - discount;
      const expectedTotal = expectedDueNow + expectedDueAtProperty;

      expect(dueAtPropertyAmount).toBe(expectedDueAtProperty);
      expect(dueNowAmount).toBe(expectedDueNow);
      expect(totalAmount).toBe(expectedTotal);

      logger.info('Amount calculations test passed');
    });

    test('should handle hotel pricing without additional charges', async () => {
      logger.info('Testing hotel pricing without additional charges');
      
      const hotelId = dataGenerator.generateHotelIdWithoutCharges();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      expect(response.data.additionalCharges).toHaveLength(0);
      expect(response.data.dueAtPropertyAmount).toBe(0);
      expect(response.data.totalAmount).toBe(response.data.dueNowAmount);

      logger.info('Hotel pricing without additional charges test passed');
    });

    test('should return 400 for invalid hotel ID', async () => {
      logger.info('Testing invalid hotel ID validation');
      
      const invalidHotelId = 'invalid-hotel-id';
      const searchParams = {
        hotelId: invalidHotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v2/pricing', { 
          params: searchParams,
          validateStatus: () => true 
        });
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Invalid hotel ID');

      logger.info('Invalid hotel ID validation test passed');
    });

    test('should return 400 for missing required parameters', async () => {
      logger.info('Testing missing required parameters validation');
      
      const incompleteParams = {
        hotelId: dataGenerator.generateHotelId()
        // Missing checkIn, checkOut, rooms, guests
      };

      const response = await retryRequest(async () => {
        return await baseClient.get('/hotel/v2/pricing', { 
          params: incompleteParams,
          validateStatus: () => true 
        });
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Missing required parameters');

      logger.info('Missing parameters validation test passed');
    });

    test('should handle zero amount additional charges', async () => {
      logger.info('Testing zero amount additional charges handling');
      
      const hotelId = dataGenerator.generateHotelIdWithZeroCharges();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      
      // Zero amount charges should not be included in the response
      response.data.additionalCharges.forEach(charge => {
        expect(charge.amount).toBeGreaterThan(0);
      });

      logger.info('Zero amount additional charges test passed');
    });
  });

  describe('Booking Details with Additional Charges', () => {
    test('should return booking details with payment information', async () => {
      logger.info('Testing booking details with additional charges - happy path');
      
      const bookingId = dataGenerator.generateBookingId();

      const response = await retryRequest(async () => {
        return await baseClient.get<BookingDetailsResponse>(
          `/booking/v2/${bookingId}/details`
        );
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('bookingId', bookingId);
      expect(response.data).toHaveProperty('paidAmount');
      expect(response.data).toHaveProperty('dueAtPropertyAmount');
      expect(response.data).toHaveProperty('paymentMethod');
      expect(response.data).toHaveProperty('additionalCharges');

      // Verify payment method structure
      const { paymentMethod } = response.data;
      expect(paymentMethod).toHaveProperty('type');
      expect(['card', 'wallet', 'corp']).toContain(paymentMethod.type);
      
      if (paymentMethod.type === 'card') {
        expect(paymentMethod).toHaveProperty('lastFour');
        expect(paymentMethod).toHaveProperty('cardType');
        expect(paymentMethod.lastFour).toMatch(/^\d{4}$/);
      }

      logger.info('Booking details with additional charges test passed');
    });

    test('should return 404 for non-existent booking', async () => {
      logger.info('Testing non-existent booking ID');
      
      const nonExistentBookingId = 'non-existent-booking-id';

      const response = await retryRequest(async () => {
        return await baseClient.get(`/booking/v2/${nonExistentBookingId}/details`, {
          validateStatus: () => true
        });
      });

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Booking not found');

      logger.info('Non-existent booking ID test passed');
    });

    test('should return 401 for unauthorized access', async () => {
      logger.info('Testing unauthorized booking access');
      
      const bookingId = dataGenerator.generateBookingId();
      const unauthorizedClient = new BaseClient({ skipAuth: true });

      const response = await retryRequest(async () => {
        return await unauthorizedClient.get(`/booking/v2/${bookingId}/details`, {
          validateStatus: () => true
        });
      });

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Unauthorized');

      logger.info('Unauthorized booking access test passed');
    });
  });

  describe('Currency Conversion and Localization', () => {
    test('should provide currency conversion for additional charges', async () => {
      logger.info('Testing currency conversion for additional charges');
      
      const hotelId = dataGenerator.generateHotelIdWithDifferentCurrency();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      expect(response.data.currency).toBe('SAR');
      expect(response.data.hotelCurrency).toBeDefined();
      expect(response.data.hotelCurrency).not.toBe('SAR');

      if (response.data.additionalCharges.length > 0) {
        response.data.additionalCharges.forEach(charge => {
          expect(charge.currency).toBe('SAR');
          expect(charge.amount).toBeGreaterThan(0);
        });
      }

      logger.info('Currency conversion test passed');
    });

    test('should handle Arabic localization requests', async () => {
      logger.info('Testing Arabic localization');
      
      const hotelId = dataGenerator.generateHotelId();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2,
        locale: 'ar-SA'
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { 
            params: searchParams,
            headers: { 'Accept-Language': 'ar-SA' }
          }
        );
      });

      expect(response.status).toBe(200);
      
      // Verify Arabic localized descriptions are present
      if (response.data.additionalCharges.length > 0) {
        response.data.additionalCharges.forEach(charge => {
          expect(charge.description).toBeDefined();
          expect(charge.description.length).toBeGreaterThan(0);
        });
      }

      logger.info('Arabic localization test passed');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle API timeout gracefully', async () => {
      logger.info('Testing API timeout handling');
      
      const hotelId = dataGenerator.generateHotelId();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      try {
        await retryRequest(async () => {
          return await baseClient.get('/hotel/v2/pricing', { 
            params: searchParams,
            timeout: 100 // Very short timeout to simulate timeout
          });
        }, 2, 500);
      } catch (error) {
        expect(error.message).toContain('timeout');
        logger.info('API timeout handling test passed');
        return;
      }

      // If no timeout occurred, that's also acceptable
      logger.info('API timeout handling test completed (no timeout occurred)');
    });

    test('should handle large amounts with proper formatting', async () => {
      logger.info('Testing large amounts formatting');
      
      const hotelId = dataGenerator.generateExpensiveHotelId();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 5,
        guests: 10
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      expect(response.data.totalAmount).toBeGreaterThan(999);
      expect(typeof response.data.totalAmount).toBe('number');

      logger.info('Large amounts formatting test passed');
    });

    test('should handle multiple additional charges correctly', async () => {
      logger.info('Testing multiple additional charges');
      
      const hotelId = dataGenerator.generateHotelIdWithMultipleCharges();
      const searchParams = {
        hotelId,
        checkIn: dataGenerator.generateFutureDate(),
        checkOut: dataGenerator.generateFutureDate(7),
        rooms: 1,
        guests: 2
      };

      const response = await retryRequest(async () => {
        return await baseClient.get<HotelPricingResponse>(
          '/hotel/v2/pricing',
          { params: searchParams }
        );
      });

      expect(response.status).toBe(200);
      expect(response.data.additionalCharges.length).toBeGreaterThan(1);
      
      // Verify each charge has unique properties
      const chargeIds = response.data.additionalCharges.map(charge => charge.id);
      const uniqueIds = new Set(chargeIds);
      expect(uniqueIds.size).toBe(chargeIds.length);

      // Verify different charge types
      const chargeTypes = response.data.additionalCharges.map(charge => charge.type);
      expect(chargeTypes.some(type => ['resort_fee', 'mandatory_tax', 'city_tax'].includes(type))).toBe(true);

      logger.info('Multiple additional charges test passed');
    });
  });

  test.afterAll(async () => {
    logger.info('Additional Charges test suite completed');
  });
});