# Contributing Guide

Thank you for contributing to the API Automation Framework! This guide will help you get started.

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub/GitLab
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/api-automation-framework.git
cd api-automation-framework
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Install Playwright
npx playwright install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 📝 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript

- Use strict TypeScript
- Define interfaces for request/response objects
- Avoid using `any` type when possible
- Use meaningful variable names

### Test Structure

Follow the AAA pattern:

```typescript
test('should do something', async () => {
  // Arrange - Set up test data
  const data = { ... };

  // Act - Perform the action
  const response = await apiClient.post('/endpoint', data);

  // Assert - Verify the results
  expect(response.status()).toBe(200);
});
```

### File Organization

```
tests/
  ├── feature-name/
  │   ├── scenario1.spec.ts
  │   └── scenario2.spec.ts
  
src/
  ├── clients/
  │   └── featureClient.ts
  ├── helpers/
  │   └── featureHelper.ts
  └── models/
      ├── request/
      │   └── featureRequest.ts
      └── response/
          └── featureResponse.ts
```

### Naming Conventions

- **Test files**: `featureName.spec.ts`
- **Client files**: `featureClient.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` with descriptive names

## ✅ Before Submitting

### 1. Run Tests Locally

```bash
# Run all tests
npm test

# Run specific test
npx playwright test tests/your-test.spec.ts
```

### 2. Check Code Quality

```bash
# Lint check
npm run lint

# Type check
npm run type-check

# Format check
npm run format:check
```

### 3. Ensure All Tests Pass

- All existing tests should pass
- Add new tests for new features
- Update tests if modifying existing features

## 📋 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
git commit -m "feat(auth): add login endpoint tests"
git commit -m "fix(booking): correct date validation"
git commit -m "docs: update README with new examples"
git commit -m "test(traveller): add error handling tests"
```

## 🔄 Pull Request Process

### 1. Update Your Branch

```bash
# Get latest changes from main
git fetch origin
git rebase origin/main
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

On GitHub/GitLab:
1. Click "New Pull Request"
2. Select your branch
3. Fill in the PR template:
   - Description of changes
   - Related issues/tickets
   - Testing performed
   - Screenshots (if applicable)

### 4. PR Requirements

- [ ] All tests pass
- [ ] Code is formatted (Prettier)
- [ ] No linting errors
- [ ] At least 1 approval from code reviewer
- [ ] Updated documentation if needed
- [ ] No merge conflicts

## 🧪 Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { YourClient } from '../../src/clients/yourClient';

test.describe('Feature Name', () => {
  let client: YourClient;

  test.beforeAll(async () => {
    client = new YourClient();
    await client.init();
  });

  test.afterAll(async () => {
    await client.dispose();
  });

  test('should do something', async () => {
    // Test implementation
  });
});
```

### Best Practices

1. **One assertion per test** (when possible)
2. **Use descriptive test names**
3. **Test both happy and sad paths**
4. **Use dynamic test data** (DataGenerator)
5. **Clean up after tests**
6. **Keep tests independent**

### Example

```typescript
test('should create user with valid data', async () => {
  const userData = {
    name: 'John Doe',
    email: DataGenerator.generateEmail(),
    phone: DataGenerator.generatePhoneNumber(),
  };

  const response = await userClient.createUser(userData);

  await Validators.validateStatusCode(response, 201);
  const user = await response.json();
  expect(user.email).toBe(userData.email);
});
```

## 🐛 Reporting Issues

### Before Creating an Issue

- Search existing issues
- Check if it's already fixed in latest version
- Gather relevant information

### Issue Template

**Title**: Clear, descriptive title

**Description**:
- What happened?
- What did you expect?
- Steps to reproduce
- Environment details
- Error messages/logs

**Labels**: bug, enhancement, question, etc.

## 💡 Feature Requests

We welcome feature requests! Please include:

1. **Use case**: Why is this needed?
2. **Proposed solution**: How should it work?
3. **Alternatives**: What other options did you consider?
4. **Impact**: How many teams/users would benefit?

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

## 🆘 Getting Help

- **Slack**: #api-automation channel
- **Email**: platform-engineering@akeedcorp.com
- **Documentation**: [Internal Wiki](https://wiki.akeedcorp.com/api-automation)

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You!

Your contributions make this framework better for everyone. We appreciate your time and effort!

---

**Questions?** Reach out to the Platform Engineering team or ask in the #api-automation Slack channel.
