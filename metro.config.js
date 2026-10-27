const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Android 빌드 중 생겼다 사라지는 폴더를 감시하다 Metro가 죽지 않도록 제외한다.
    blockList: [
      /android[\\/]app[\\/]\.cxx[\\/].*/,
      /android[\\/]app[\\/]build[\\/].*/,
      /android[\\/]build[\\/].*/,
      /android[\\/]\.gradle[\\/].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
