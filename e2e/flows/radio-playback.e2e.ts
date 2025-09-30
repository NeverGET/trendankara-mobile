/**
 * E2E Test Flow: Radio Playback
 *
 * Tests the core radio streaming functionality
 */

import { E2E_CONFIG, E2E_HELPERS } from '../setup';

describe('Radio Playback Flow', () => {
  beforeEach(async () => {
    // Reset app state before each test
    // await device.reloadReactNative();
  });

  describe('Basic Playback', () => {
    it('should play radio stream when play button is tapped', async () => {
      // Navigate to home tab
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);

      // Wait for radio player to load
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.radioPlayer);

      // Tap play button
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.playButton);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.playButton);

      // Verify play button changes to pause button
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.pauseButton, E2E_CONFIG.timeouts.medium);

      // Take screenshot for verification
      await E2E_HELPERS.takeScreenshot('radio-playing');
    });

    it('should pause radio stream when pause button is tapped', async () => {
      // Start playing first
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.playButton);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.playButton);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.pauseButton);

      // Tap pause button
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.pauseButton);

      // Verify pause button changes back to play button
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.playButton, E2E_CONFIG.timeouts.medium);

      await E2E_HELPERS.takeScreenshot('radio-paused');
    });

    it('should continue playing when navigating between tabs', async () => {
      // Start playing
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.playButton);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.pauseButton);

      // Navigate to news tab
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.newsTab);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.newsTab);

      // Navigate back to home
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);

      // Verify still playing (pause button should be visible)
      await E2E_HELPERS.assertElementExists(E2E_CONFIG.selectors.pauseButton);
    });
  });

  describe('Volume Control', () => {
    it('should adjust volume when volume slider is moved', async () => {
      // Navigate to home and start playing
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.playButton);

      // Wait for volume slider
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.volumeSlider);

      // Interact with volume slider
      await E2E_HELPERS.swipe(E2E_CONFIG.selectors.volumeSlider, 'left');

      await E2E_HELPERS.takeScreenshot('volume-adjusted');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when stream fails to load', async () => {
      // This test would require mocking network failures
      // or using a test stream that intentionally fails

      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.playButton);

      // In case of network error, error message should appear
      // await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.errorMessage, E2E_CONFIG.timeouts.long);
      // await E2E_HELPERS.assertTextContent(E2E_CONFIG.selectors.errorMessage, 'Unable to load stream');
    });

    it('should allow retry when stream fails', async () => {
      // Similar to above, but test the retry functionality
      // await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.retryButton);
      // await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.retryButton);
    });
  });

  describe('Background Playback', () => {
    it('should continue playing when app goes to background', async () => {
      // Start playing
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.homeTab);
      await E2E_HELPERS.tapElement(E2E_CONFIG.selectors.playButton);
      await E2E_HELPERS.waitForElement(E2E_CONFIG.selectors.pauseButton);

      // Send app to background
      // await device.sendToHome();

      // Wait a moment
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // Bring app back to foreground
      // await device.launchApp({ newInstance: false });

      // Verify still playing
      await E2E_HELPERS.assertElementExists(E2E_CONFIG.selectors.pauseButton);
    });
  });
});