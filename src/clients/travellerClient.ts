import { BaseClient } from './baseClient';
import { ENV } from '../config/env.config';

export interface BookingRequest {
  reference: string;
  customerEmail: string;
  destination: string;
  travelDate: string;
  numberOfTravelers?: number;
}

export class TravellerClient extends BaseClient {
  constructor() {
    super(ENV.apiBaseUrl);
  }

  async createBooking(bookingData: BookingRequest) {
    return await this.post('/api/v1/bookings', bookingData);
  }

  async getBooking(bookingId: string) {
    return await this.get(`/api/v1/bookings/${bookingId}`);
  }

  async updateBooking(bookingId: string, updateData: Partial<BookingRequest>) {
    return await this.patch(`/api/v1/bookings/${bookingId}`, updateData);
  }

  async cancelBooking(bookingId: string) {
    return await this.delete(`/api/v1/bookings/${bookingId}`);
  }

  async listBookings(filters?: { status?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams(filters as any).toString();
    const endpoint = queryParams ? `/api/v1/bookings?${queryParams}` : '/api/v1/bookings';
    return await this.get(endpoint);
  }
}
