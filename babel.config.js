module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // worklets/plugin removido — incompativel com Expo Go SDK 55.
    // Reanimated/Skia entram quando rodarmos development build (Fase 5).
  };
};
