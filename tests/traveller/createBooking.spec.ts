import { test, expect } from '@playwright/test';
import { TravellerClient } from '../../src/clients/travellerClient';
import { DataGenerator } from '../../src/helpers/dataGenerator';
import { Validators } from '../../src/helpers/validators';

test.describe('Traveller API - Create Booking', () => {
  let travellerClient: TravellerClient;

  test.beforeAll(async () => {
    travellerClient = new TravellerClient();
    await travellerClient.init();
  });

  test.afterAll(async () => {
    await travellerClient.dispose();
  });

  test('should create a new booking successfully', async () => {
    // Arrange
    const bookingData = {
      reference: DataGenerator.generateBookingReference(),
      customerEmail: DataGenerator.generateEmail(),
      destination: DataGenerator.generateSaudiCity(),
      travelDate: DataGenerator.futureDate(30),
      numberOfTravelers: DataGenerator.randomInt(1, 5),
    };

    // Act
    const startTime = Date.now();
    const response = await travellerClient.createBooking(bookingData);
    const duration = Date.now() - startTime;

    // Assert
    await Validators.validateStatusCode(response, 201);
    Validators.validateResponseTime(duration, 3000);

    const responseBody = await response.json();
    await Validators.validateSchema(responseBody, ['id', 'reference', 'status', 'createdAt']);

    expect(responseBody.reference).toBe(bookingData.reference);
    expect(responseBody.status).toBe('PENDING');
    expect(responseBody.destination).toBe(bookingData.destination);
  });

  test('should return 400 for invalid booking data - missing reference', async () => {
    // Arrange
    const invalidBookingData = {
      reference: '',
      customerEmail: DataGenerator.generateEmail(),
      destination: 'Riyadh',
      travelDate: DataGenerator.futureDate(30),
    };

    // Act
    const response = await travellerClient.createBooking(invalidBookingData);

    // Assert
    await Validators.validateStatusCode(response, 400);

    const responseBody = await response.json();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.message).toContain('reference');
  });

  test('should return 400 for invalid email format', async () => {
    // Arrange
    const bookingData = {
      reference: DataGenerator.generateBookingReference(),
      customerEmail: 'invalid-email',
      destination: 'Riyadh',
      travelDate: DataGenerator.futureDate(30),
    };

    // Act
    const response = await travellerClient.createBooking(bookingData);

    // Assert
    await Validators.validateStatusCode(response, 400);

    const responseBody = await response.json();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.message).toContain('email');
  });

  test('should return 400 for past travel date', async () => {
    // Arrange
    const bookingData = {
      reference: DataGenerator.generateBookingReference(),
      customerEmail: DataGenerator.generateEmail(),
      destination: 'Riyadh',
      travelDate: '2020-01-01', // Past date
    };

    // Act
    const response = await travellerClient.createBooking(bookingData);

    // Assert
    await Validators.validateStatusCode(response, 400);

    const responseBody = await response.json();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.message).toContain('date');
  });

  test('should handle concurrent booking creation', async () => {
    // Arrange
    const bookings = Array.from({ length: 5 }, () => ({
      reference: DataGenerator.generateBookingReference(),
      customerEmail: DataGenerator.generateEmail(),
      destination: DataGenerator.generateSaudiCity(),
      travelDate: DataGenerator.futureDate(DataGenerator.randomInt(1, 90)),
    }));

    // Act
    const responses = await Promise.all(
      bookings.map((booking) => travellerClient.createBooking(booking))
    );

    // Assert
    for (const response of responses) {
      await Validators.validateStatusCode(response, 201);
    }

    expect(responses).toHaveLength(5);
  });
});
