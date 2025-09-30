module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],  // Use Expo preset, not metro preset
    plugins: [
      // Add reanimated plugin last if using react-native-reanimated
      'react-native-reanimated/plugin'
    ].filter(Boolean)
  };
};