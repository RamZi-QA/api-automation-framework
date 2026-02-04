export class DataGenerator {
  /**
   * Generate unique email address
   */
  static generateEmail(prefix: string = 'test.user'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}.${timestamp}.${random}@akeedcorp.com`;
  }

  /**
   * Generate random phone number (Saudi Arabia format)
   */
  static generatePhoneNumber(countryCode: string = '+966'): string {
    const number = Math.floor(100000000 + Math.random() * 900000000);
    return `${countryCode}${number}`;
  }

  /**
   * Generate unique booking reference
   */
  static generateBookingReference(prefix: string = 'BKG'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate random string of specified length
   */
  static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random date between start and end dates
   */
  static randomDate(start: Date = new Date(), end: Date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)): string {
    const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(timestamp).toISOString().split('T')[0];
  }

  /**
   * Generate future date (days from now)
   */
  static futureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate random UUID v4
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Pick random item from array
   */
  static randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate random password
   */
  static generatePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate random Arabic name
   */
  static generateArabicName(): string {
    const firstNames = ['محمد', 'أحمد', 'فاطمة', 'عائشة', 'علي', 'حسن', 'سارة', 'نور'];
    const lastNames = ['العتيبي', 'القحطاني', 'الغامدي', 'الدوسري', 'الشمري', 'المطيري'];
    return `${this.randomFromArray(firstNames)} ${this.randomFromArray(lastNames)}`;
  }

  /**
   * Generate random city (Saudi Arabia)
   */
  static generateSaudiCity(): string {
    const cities = ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha'];
    return this.randomFromArray(cities);
  }
}
