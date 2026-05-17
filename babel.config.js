module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 worklets — necessario pro build EAS.
      // Em Expo Go SDK 55 ainda pode dar warning, mas no dev build funciona.
      'react-native-worklets/plugin',
    ],
  };
};
