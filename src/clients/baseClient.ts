import { APIRequestContext, request } from '@playwright/test';
import { logger } from '../helpers/logger';

export class BaseClient {
  protected context!: APIRequestContext;
  protected baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async init(extraHeaders: Record<string, string> = {}) {
    this.context = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...extraHeaders,
      },
    });
    logger.info(`API Client initialized with baseURL: ${this.baseURL}`);
  }

  async get(endpoint: string, options = {}) {
    logger.info(`GET ${endpoint}`);
    const response = await this.context.get(endpoint, options);
    logger.info(`GET ${endpoint} - Status: ${response.status()}`);
    return response;
  }

  async post(endpoint: string, data: any, options = {}) {
    logger.info(`POST ${endpoint}`);
    const response = await this.context.post(endpoint, {
      data,
      ...options,
    });
    logger.info(`POST ${endpoint} - Status: ${response.status()}`);
    return response;
  }

  async put(endpoint: string, data: any, options = {}) {
    logger.info(`PUT ${endpoint}`);
    const response = await this.context.put(endpoint, {
      data,
      ...options,
    });
    logger.info(`PUT ${endpoint} - Status: ${response.status()}`);
    return response;
  }

  async patch(endpoint: string, data: any, options = {}) {
    logger.info(`PATCH ${endpoint}`);
    const response = await this.context.patch(endpoint, {
      data,
      ...options,
    });
    logger.info(`PATCH ${endpoint} - Status: ${response.status()}`);
    return response;
  }

  async delete(endpoint: string, options = {}) {
    logger.info(`DELETE ${endpoint}`);
    const response = await this.context.delete(endpoint, options);
    logger.info(`DELETE ${endpoint} - Status: ${response.status()}`);
    return response;
  }

  async dispose() {
    await this.context.dispose();
    logger.info('API Client disposed');
  }
}
