const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, { 
  isCSSEnabled: true,
  resolver: {
    assetExts: ["png", "jpg", "jpeg", "gif", "webp"],
  }
});

module.exports = withNativeWind(config, { input: './app/global.css' });
