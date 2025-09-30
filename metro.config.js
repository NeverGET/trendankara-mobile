const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix module resolution issues per document recommendations
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Prevent undefined module errors
  if (!moduleName) return { type: 'empty' };
  return context.resolveRequest(context, moduleName, platform);
};

// Ensure proper source extensions
config.resolver.sourceExts.push('jsx', 'ts', 'tsx');

// Add support for additional file extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
];

module.exports = config;