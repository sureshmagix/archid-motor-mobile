const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    extraNodeModules: {
      buffer: require.resolve('buffer'),
      process: require.resolve('process'),
      stream: require.resolve('stream-browserify'),
      events: require.resolve('events'),
      util: require.resolve('util'),
    },
  },
});
