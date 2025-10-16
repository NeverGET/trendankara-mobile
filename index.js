/**
 * App Entry Point
 * This file registers the app with React Native and configures TrackPlayer background service
 */
import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';

import App from './App';

// Register PlaybackService for background operation
// IMPORTANT: Must pass a function factory, not the module itself
TrackPlayer.registerPlaybackService(() => require('./services/audio/PlaybackService.js'));

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
