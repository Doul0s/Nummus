// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite ships wa-sqlite as .wasm for web targets.
config.resolver.assetExts.push("wasm");

module.exports = config;
