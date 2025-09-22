// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// react-three-fiber
config.resolver.sourceExts.push('js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs');
config.resolver.assetExts.push('mp3', 'ttf', 'obj', 'glb', 'vrm', 'vrma', 'fbx', 'mtl', 'png', 'jpg');

config.transformer.unstable_allowRequireContext = true;

module.exports = config;

