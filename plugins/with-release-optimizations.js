const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Release optimizations applied during prebuild (no extra dependency required):
 * - R8/ProGuard code minification
 * - Unused resource shrinking
 * - PNG crunching
 *
 * These reduce APK size and improve startup/memory behavior on low-end devices.
 */
const PROPERTIES = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
  'android.enablePngCrunchInReleaseBuilds': 'true',
};

module.exports = function withReleaseOptimizations(config) {
  return withGradleProperties(config, (cfg) => {
    const properties = cfg.modResults;
    for (const [key, value] of Object.entries(PROPERTIES)) {
      const index = properties.findIndex(
        (item) => item && item.type === 'property' && item.key === key
      );
      if (index >= 0) {
        properties[index].value = value;
      } else {
        properties.push({ type: 'property', key, value });
      }
    }
    return cfg;
  });
};
