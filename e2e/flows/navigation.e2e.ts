/**
 * E2E Test Flow: Navigation
 *
 * Tests navigation between different screens and tabs
 */

import { E2E_CONFIG, E2E_HELPERS } from '../setup';

describe('Navigation Flow', () => {
  beforeEach(async () => {
    // Reset app state before each test
    // await device.reloadReactNative();
  });

  describe('Tab Navigation', () => {
    it('should navigate between all main tabs', async () => {
      // Test Home tab
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.takeScreenshot('home-tab');

      // Test Polls tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.pollsTab);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.pollsTab);
      await E2E_HELPERS.takeScreenshot('polls-tab');

      // Test News tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.newsTab);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.newsTab);
      await E2E_HELPERS.takeScreenshot('news-tab');

      // Test Sponsors tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.sponsorsTab);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.sponsorsTab);
      await E2E_HELPERS.takeScreenshot('sponsors-tab');
    });

    it('should maintain tab state when switching between tabs', async () => {
      // Navigate to polls tab and interact with content
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.pollsTab);

      // Switch to another tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.newsTab);

      // Return to polls tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.pollsTab);

      // Verify polls tab content is still there
      await E2E_HELPERS.assertElementExists(E2E_CONFIG.selectors.pollsTab);
    });
  });

  describe('Deep Navigation', () => {
    it('should navigate to news article detail', async () => {
      // Navigate to news tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.newsTab);

      // Wait for news list to load
      await E2E_HELPERS.waitForElement('news-list');

      // Tap on first news article
      await E2E_HELPERS.waitForElement('news-item-0');
      await E2E_HELPERS.tapElement('news-item-0');

      // Verify navigation to article detail
      await E2E_HELPERS.waitForElement('article-detail');
      await E2E_HELPERS.takeScreenshot('news-article-detail');

      // Test back navigation
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.backButton);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.backButton);

      // Verify back to news list
      await E2E_HELPERS.waitForElement('news-list');
    });

    it('should navigate to poll detail', async () => {
      // Navigate to polls tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.pollsTab);

      // Wait for polls list to load
      await E2E_HELPERS.waitForElement('polls-list');

      // Tap on first poll
      await E2E_HELPERS.waitForElement('poll-item-0');
      await E2E_HELPERS.tapElement('poll-item-0');

      // Verify navigation to poll detail
      await E2E_HELPERS.waitForElement('poll-detail');
      await E2E_HELPERS.takeScreenshot('poll-detail');

      // Test back navigation
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.backButton);
      await E2E_HELPERS.waitForElement('polls-list');
    });
  });

  describe('Settings Navigation', () => {
    it('should navigate to settings screen', async () => {
      // Tap settings button (assuming it's accessible from home)
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.settingsButton);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.settingsButton);

      // Verify settings screen
      await E2E_HELPERS.waitForElement('settings-screen');
      await E2E_HELPERS.takeScreenshot('settings-screen');

      // Test back navigation
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.backButton);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.homeTab);
    });

    it('should navigate to about screen from settings', async () => {
      // Navigate to settings
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.settingsButton);
      await E2E_HELPERS.waitForElement('settings-screen');

      // Tap about option
      await E2E_HELPERS.waitForElement('about-option');
      await E2E_HELPERS.tapElement('about-option');

      // Verify about screen
      await E2E_HELPERS.waitForElement('about-screen');
      await E2E_HELPERS.takeScreenshot('about-screen');
    });
  });

  describe('Deep Linking', () => {
    it('should handle deep link to specific news article', async () => {
      // This would test opening the app with a deep link
      // await device.openURL({ url: 'trendankara://article/123' });

      // Verify navigation to specific article
      // await E2E_HELPERS.waitForElement('article-detail');
      // await E2E_HELPERS.assertTextContent('article-title', 'Specific Article Title');
    });

    it('should handle deep link to specific poll', async () => {
      // Test opening the app with a poll deep link
      // await device.openURL({ url: 'trendankara://poll/456' });

      // Verify navigation to specific poll
      // await E2E_HELPERS.waitForElement('poll-detail');
    });
  });

  describe('Navigation Performance', () => {
    it('should navigate between tabs quickly', async () => {
      const startTime = Date.now();

      // Perform rapid tab switching
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.pollsTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.newsTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.sponsorsTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);

      const endTime = Date.now();
      const navigationTime = endTime - startTime;

      // Assert navigation completed within reasonable time (5 seconds)
      if (navigationTime > 5000) {
        throw new Error(`Navigation took too long: ${navigationTime}ms`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      // Test navigation when network is unavailable
      // This would require mocking network conditions

      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.newsTab);

      // In case of network error, should show error state
      // await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.errorMessage);
    });

    it('should recover from navigation errors', async () => {
      // Test retry functionality when navigation fails
      // await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.retryButton);
      // await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.retryButton);
    });
  });
});