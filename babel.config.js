module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],  // Use Expo preset, not metro preset
    plugins: [
      // Add worklets plugin last (replaces react-native-reanimated/plugin)
      'react-native-worklets/plugin'
    ].filter(Boolean)
  };
};