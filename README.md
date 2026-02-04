# API Automation Framework

> A standardized API testing framework using Playwright and TypeScript for Traveller App, AkeedCorp, and AkeedOS

[![CI/CD](https://github.com/akeedcorp/api-automation-framework/workflows/API%20Tests/badge.svg)](https://github.com/akeedcorp/api-automation-framework/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-green)](https://playwright.dev/)

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Contributing](#contributing)
- [Support](#support)

## 🎯 Overview

This framework provides a standardized approach to API testing across all squads. It's built with:

- **Playwright** - Modern API testing framework
- **TypeScript** - Type-safe test development
- **Modular Architecture** - Easy to extend and maintain
- **CI/CD Ready** - GitHub Actions & GitLab CI support

## ✅ Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **IDE**: VS Code (recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier - Code formatter
- TypeScript and JavaScript Language Features

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/akeedcorp/api-automation-framework.git
cd api-automation-framework
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Playwright

```bash
npx playwright install
```

### 4. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```bash
API_BASE_URL_DEV=https://dev-api.akeedcorp.com
API_BASE_URL_QA=https://qa-api.akeedcorp.com
API_KEY=your-api-key-here
API_SECRET=your-api-secret-here
```

### 5. Run Your First Test

```bash
npm run test:dev
```

### 6. View Test Report

```bash
npm run report
```

## 📁 Project Structure

```
api-automation-framework/
├── src/
│   ├── clients/              # API client implementations
│   │   ├── baseClient.ts     # Base HTTP client
│   │   ├── authClient.ts     # Authentication client
│   │   └── travellerClient.ts
│   │
│   ├── config/               # Configuration files
│   │   ├── env.config.ts     # Environment configuration
│   │   └── test.config.ts    # Test configuration
│   │
│   ├── helpers/              # Utility functions
│   │   ├── dataGenerator.ts  # Test data generators
│   │   ├── validators.ts     # Response validators
│   │   └── logger.ts         # Logging utilities
│   │
│   ├── models/               # TypeScript interfaces
│   │   ├── request/          # Request models
│   │   └── response/         # Response models
│   │
│   └── testData/             # Static test data
│       ├── users.json
│       └── bookings.json
│
├── tests/                    # Test files
│   ├── auth/                 # Authentication tests
│   ├── traveller/            # Traveller API tests
│   └── smoke/                # Smoke tests
│
├── reports/                  # Test reports (generated)
├── .github/workflows/        # GitHub Actions workflows
├── .env.example              # Example environment file
├── .gitignore
├── package.json
├── tsconfig.json
├── playwright.config.ts
└── README.md
```

## ✍️ Writing Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test';
import { BaseClient } from '../src/clients/baseClient';
import { ENV } from '../src/config/env.config';

test.describe('User API Tests', () => {
  let apiClient: BaseClient;

  test.beforeAll(async () => {
    apiClient = new BaseClient(ENV.apiBaseUrl);
    await apiClient.init();
  });

  test.afterAll(async () => {
    await apiClient.dispose();
  });

  test('should get user by ID', async () => {
    const response = await apiClient.get('/api/v1/users/123');
    
    expect(response.status()).toBe(200);
    
    const user = await response.json();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
  });
});
```

### Using Test Data Generators

```typescript
import { DataGenerator } from '../src/helpers/dataGenerator';

test('should create new user', async () => {
  const userData = {
    name: 'John Doe',
    email: DataGenerator.generateEmail(),
    phone: DataGenerator.generatePhoneNumber(),
  };
  
  const response = await apiClient.post('/api/v1/users', userData);
  expect(response.status()).toBe(201);
});
```

### Using Validators

```typescript
import { Validators } from '../src/helpers/validators';

test('should validate response schema', async () => {
  const response = await apiClient.get('/api/v1/bookings/123');
  
  await Validators.validateStatusCode(response, 200);
  
  const booking = await response.json();
  await Validators.validateSchema(booking, ['id', 'reference', 'status']);
});
```

## 🏃 Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests by Environment

```bash
# Development environment
npm run test:dev

# QA environment
npm run test:qa

# Staging environment
npm run test:staging
```

### Run Specific Test Suite

```bash
# Smoke tests only
npm run test:smoke

# Auth tests only
npx playwright test tests/auth

# Single test file
npx playwright test tests/traveller/createBooking.spec.ts
```

### Debug Mode

```bash
# Run in headed mode
npm run test:headed

# Run in debug mode
npm run test:debug
```

### Generate and View Reports

```bash
# Generate HTML report
npm run report

# This will open the report in your browser
```

## 🔄 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Scheduled daily at 2 AM UTC

Check `.github/workflows/api-tests.yml` for configuration.

### GitLab CI

Tests run automatically on:
- Merge requests
- Push to `main` and `develop`
- Manual triggers for staging

Check `.gitlab-ci.yml` for configuration.

### Environment Variables in CI/CD

Configure these secrets in your CI/CD platform:

- `API_BASE_URL_DEV`
- `API_BASE_URL_QA`
- `API_BASE_URL_STAGING`
- `API_KEY`
- `API_SECRET`

## 🤝 Contributing

We welcome contributions from all squads! Here's how to contribute:

### 1. Create a Feature Branch

```bash
git checkout -b feature/add-payment-tests
```

### 2. Make Your Changes

- Write your tests following the existing patterns
- Ensure tests pass locally
- Follow the coding standards (ESLint/Prettier)

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add payment API tests"
```

Use conventional commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding tests
- `refactor:` - Code refactoring

### 4. Push and Create Pull Request

```bash
git push origin feature/add-payment-tests
```

Create a pull request on GitHub/GitLab with:
- Clear description of changes
- Link to related tickets (JIRA, etc.)
- Test results screenshot

### Code Review Process

- At least 1 approval required
- All tests must pass in CI/CD
- No merge conflicts
- Follows coding standards

### Coding Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Format code with Prettier
- Write descriptive test names
- Add comments for complex logic
- Keep functions small and focused

## 📚 Additional Resources

- [Playwright API Testing Docs](https://playwright.dev/docs/api-testing)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Internal Wiki - API Automation](https://wiki.akeedcorp.com/api-automation)
- [Notion Page - Complete Guide](https://notion.akeedcorp.com/api-automation-guide)

## 🆘 Support

### Getting Help

- **Slack**: #api-automation channel
- **Email**: platform-engineering@akeedcorp.com
- **JIRA**: Create a ticket with label `api-automation`

### Common Issues

**Issue**: `Cannot find module '@playwright/test'`
```bash
# Solution: Reinstall dependencies
npm install
npx playwright install
```

**Issue**: `Environment variable not found`
```bash
# Solution: Check .env file exists and has correct values
cp .env.example .env
# Edit .env with your values
```

**Issue**: Tests failing in CI but passing locally
```bash
# Solution: Ensure environment variables are set in CI/CD
# Check CI/CD logs for specific errors
```

## 📝 License

This project is proprietary to AkeedCorp and is for internal use only.

## 👥 Maintainers

- **Platform Engineering Team** - Framework maintenance
- **Squad Leads** - Squad-specific contributions

---

**Last Updated**: February 2026  
**Version**: 1.0.0

For questions or suggestions, please reach out to the Platform Engineering team.
