const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web (alpha) backend loads a wasm worker — teach Metro to bundle it as an asset.
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './src/global.css' });
