# Testing Guide

This document outlines the testing approach, setup, and procedures for the TrendAnkara mobile application.

## Testing Strategy

Our testing strategy follows a pyramid approach:

1. **Unit Tests** (70%) - Fast, focused tests for individual functions and components
2. **Integration Tests** (20%) - Tests for component interactions and service integrations
3. **E2E Tests** (10%) - End-to-end user journey tests

## Test Structure

```
__tests__/
├── components/          # Component tests
├── services/           # Service tests
├── utils/             # Utility function tests
└── integration/       # Integration tests

e2e/
├── setup.ts           # E2E test configuration
└── flows/            # E2E test flows
    ├── radio-playback.e2e.ts
    └── navigation.e2e.ts
```

## Setup and Installation

### Prerequisites

- Node.js 18+
- React Native development environment
- iOS Simulator (for iOS testing)
- Android Emulator (for Android testing)

### Test Dependencies

The following testing dependencies are already installed:

```json
{
  "@testing-library/jest-native": "^5.4.3",
  "@testing-library/react-native": "^13.3.3",
  "@types/jest": "^30.0.0",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^30.1.2",
  "ts-jest": "^29.4.4"
}
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- OptimizedImage.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### Test Coverage

View coverage reports:

```bash
# Generate coverage report
npm test -- --coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

Coverage targets:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### E2E Tests

E2E tests are currently set up as a framework but require additional tooling (Detox, Maestro, etc.) for full implementation.

```bash
# Install Detox (optional)
npm install --save-dev detox

# Run E2E tests (once Detox is configured)
# npx detox test
```

## Writing Tests

### Unit Tests

```typescript
// Example: Testing a utility function
import { formatDuration } from '../../utils/time';

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});
```

### Component Tests

```typescript
// Example: Testing a React component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OptimizedImage from '../../components/OptimizedImage';

describe('OptimizedImage', () => {
  it('should render with source', () => {
    const { getByTestId } = render(
      <OptimizedImage source={{ uri: 'test.jpg' }} />
    );

    expect(getByTestId('optimized-image')).toBeTruthy();
  });
});
```

### Service Tests

```typescript
// Example: Testing a service
import { VideoPlayerService } from '../../services/VideoPlayerService';

describe('VideoPlayerService', () => {
  it('should create player instance', () => {
    const service = VideoPlayerService.getInstance();
    const playerId = service.createPlayer('stream-url');

    expect(typeof playerId).toBe('string');
  });
});
```

## Test Guidelines

### Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component/function does, not how it does it
   - Test user interactions and expected outcomes

2. **Keep Tests Simple and Focused**
   - One assertion per test when possible
   - Clear test names that describe the behavior being tested

3. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should display error message when network request fails')

   // Bad
   it('should work correctly')
   ```

4. **Mock External Dependencies**
   ```typescript
   // Mock API calls
   jest.mock('../../services/api', () => ({
     fetchNews: jest.fn().mockResolvedValue(mockNewsData),
   }));
   ```

5. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
     cleanup();
   });
   ```

### Testing Patterns

#### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();

  await expect(promise).resolves.toBe(expectedValue);
  // or
  await expect(promise).rejects.toThrow('Error message');
});
```

#### Testing User Interactions

```typescript
it('should handle button press', () => {
  const mockOnPress = jest.fn();
  const { getByText } = render(
    <Button onPress={mockOnPress}>Press me</Button>
  );

  fireEvent.press(getByText('Press me'));
  expect(mockOnPress).toHaveBeenCalled();
});
```

#### Testing Error Boundaries

```typescript
it('should catch errors and display fallback UI', () => {
  const ThrowingComponent = () => {
    throw new Error('Test error');
  };

  const { getByText } = render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  expect(getByText('Something went wrong')).toBeTruthy();
});
```

## Mocking

### Common Mocks

The test setup includes mocks for:

- React Native Reanimated
- Expo modules (expo-av, expo-video, expo-image)
- React Navigation
- AsyncStorage
- Redux Persist

### Custom Mocks

Create custom mocks in `__mocks__` directory:

```typescript
// __mocks__/expo-av.ts
export const Audio = {
  setAudioModeAsync: jest.fn(),
  Sound: {
    createAsync: jest.fn().mockResolvedValue({
      sound: {
        playAsync: jest.fn(),
        pauseAsync: jest.fn(),
      },
    }),
  },
};
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm test -- --coverage --watchAll=false

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check timezone differences
   - Ensure all dependencies are properly mocked
   - Use `--runInBand` flag for serial execution

2. **Async test timeouts**
   - Increase timeout values
   - Ensure all promises are properly awaited
   - Check for unresolved promises

3. **Mock issues**
   - Verify mocks are set up before imports
   - Clear mocks between tests
   - Check mock implementation matches expected interface

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with debug
npm test -- --testNamePattern="specific test" --verbose

# Run tests with node debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Testing

### Monitoring Test Performance

```typescript
// Example: Performance test
it('should render quickly', () => {
  const startTime = performance.now();

  render(<ComplexComponent />);

  const endTime = performance.now();
  const renderTime = endTime - startTime;

  expect(renderTime).toBeLessThan(100); // 100ms threshold
});
```

### Load Testing

For load testing the app's performance:

1. Use React DevTools Profiler
2. Monitor memory usage during tests
3. Test with large datasets
4. Measure component render times

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

### Tools

- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **Detox**: E2E testing framework (optional)
- **Maestro**: Alternative E2E testing tool
- **Flipper**: Debug and inspect during testing

### Example Commands

```bash
# Install additional testing tools
npm install --save-dev @testing-library/user-event
npm install --save-dev jest-extended

# Run tests with specific configuration
npm test -- --config jest.config.custom.js

# Generate test coverage badge
npm install --save-dev coverage-badge-creator
npx coverage-badge-creator
```

---

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass
3. Maintain or improve coverage percentage
4. Update this documentation if adding new testing patterns

For questions about testing practices, refer to this guide or create an issue in the project repository.