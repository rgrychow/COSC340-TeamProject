import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  plugins: [
    'expo-camera',
    ...(config.plugins || []),
  ],

  ios: {
    ...config.ios,
    infoPlist: {
      ...(config.ios?.infoPlist || {}),
      NSCameraUsageDescription:
        'AimHigh uses the camera to scan food barcodes for nutritioninfo.',
    },
  },

  android: {
    ...config.android,
    permissions: [...(config.android?.permissions || []), 'CAMERA'],
  },

  extra: {
    ...config.extra,
    USDA_API_KEY: process.env.USDA_API_KEY,
    NUTRITIONIX_APP_ID: process.env.NUTRITIONIX_APP_ID,
    NUTRITIONIX_APP_KEY: process.env.NUTRITIONIX_APP_KEY,
  },
});
